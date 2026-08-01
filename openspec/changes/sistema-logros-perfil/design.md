## Context

El perfil no cruza datos con los módulos de juego, pese a que
`weekly_picks`/`games.outcome` (Pickem) y `survivor_state` (Survivor) ya
contienen toda la señal necesaria para reconocer logros. El sistema de diseño
ya define el lenguaje visual (`--accent-gold`, tipografía mono/Bebas Neue,
"stat card" estilo FIFA Ultimate Team) pero no existe hoy ninguna lógica de
datos ni tabla de logros. Este design.md fija catálogo v1, modelo de datos,
disparo de cálculo y estructura visual antes de tocar código.

## Goals / Non-Goals

**Goals:**
- Definir un catálogo v1 concreto de logros, derivable con datos y señales de
  "cierre" que ya existen (sin depender de conceptos que no existen hoy, como
  un flag de "temporada cerrada").
- Definir el modelo de datos (`achievements`, `user_achievements`) y su RLS.
- Definir cuándo y cómo se evalúan/desbloquean los logros, reutilizando los
  triggers ya existentes en vez de sumar un cron nuevo.
- Definir la agregación de estadísticas transversal a grupos para el header
  de perfil.
- Definir la estructura visual del rediseño de `ProfilePage.tsx`.

**Non-Goals:**
- No hay catálogo configurable por admin/grupo en v1 (los logros se siembran
  por migración, no por UI admin).
- No hay notificación push/toast al desbloquear un logro en v1 — el usuario
  lo ve reflejado la próxima vez que visita su perfil.
- No hay puntos, experiencia ni niveles — son badges binarios
  (desbloqueado/bloqueado), sin ranking de logros entre usuarios.
- No se muestran logros de terceros (solo los propios) — evita tener que
  resolver membership de grupo en la policy de lectura.
- No se rediseña el resto de la navegación ni `AppLayout`, solo
  `ProfilePage.tsx`.
- Ningún logro ni copy hace referencia a dinero, premios o cuotas (regla dura
  del proyecto, ver `doc/design-system.md` §8).

## Decisions

**1. Catálogo v1 fijo, sembrado por migración**

Tabla `achievements` (catálogo, lectura pública para autenticados):
`id` (text, slug, PK — ej. `pickem_semana_perfecta`), `scope`
(`pickem` | `survivor` | `general`), `title`, `description`, `created_at`.
Sin panel admin en v1; agregar/editar un logro implica una migración nueva
(aceptado conscientemente, ver Risks).

Lista v1 (elegida porque cada una tiene una señal de "cierre" clara y ya
existente en el modelo de datos — no dependen de un concepto de "temporada
cerrada" que hoy no existe):

*Pickem Semanal:*
- `pickem_primer_pick` — registrar su primer pick histórico.
- `pickem_semana_perfecta` — acertar el 100% de los partidos de una semana
  con al menos 3 partidos, una vez que todos esos partidos ya tienen
  `outcome` (evita trivializarlo en semanas de 1-2 partidos).
- `pickem_racha_5` — 5 aciertos consecutivos, ordenados por `kickoff_at`,
  considerando solo partidos con pick registrado y `outcome` definido.
- `pickem_lider_semana` — terminar en el primer puesto (o empatado en el
  primer puesto) de `pickem_weekly_standings` de una semana ya cerrada
  (todos sus partidos con `outcome`).

*Survivor:*
- `survivor_temporada_regular` — seguir `alive` al no quedar más semanas
  regulares por procesar (mismo corte que usa
  `survivor_current_week_number()`).
- `survivor_podio` — `final_rank` en (1, 2, 3).
- `survivor_vida_intacta` — llegar a eliminado o al cierre de temporada
  regular con `current_life = 1` (nunca solicitó vida extra).

*General:*
- `veterano` — más de 1 año desde `profiles.created_at`.
- `doble_jugador` — tiene `weekly_access` aprobado y al menos un
  `survivor_picks` en el mismo grupo.

**2. Tabla `user_achievements`**

Columnas: `user_id`, `achievement_id` (FK `achievements`), `group_id`
(nullable — logros por grupo como `survivor_podio`/`pickem_lider_semana`
llevan el grupo donde se obtuvieron; logros globales como `veterano` van con
`group_id null`), `unlocked_at`. Índice único sobre
`(user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))`
para permitir obtener el mismo logro "por grupo" en más de un grupo (ej.
`pickem_lider_semana`) sin duplicar los globales.

**3. Evaluación disparada por los triggers ya existentes, sin cron nuevo**

Nueva función interna `_evaluate_achievements_for_group(p_group_id uuid)`
(`security definer`, sin grants públicos) que revisa las condiciones de
arriba para todos los usuarios relevantes del grupo y hace
`insert ... on conflict do nothing` en `user_achievements`. Se invoca desde:
- El trigger `AFTER UPDATE OF outcome ON games` ya existente (mismo que
  dispara `_survivor_recompute`) — cubre los logros de Pickem.
- El final de `_survivor_recompute` — cubre los logros de Survivor, ya que
  ahí es donde se recalculan `current_life`/`status`/`final_rank`.
- Un RPC `recalculate_achievements(p_group_id)`, solo para
  `platform_admins`, como plan B manual — mismo patrón que
  `recalculate_survivor_state` de `modulo-survivor`.

Logro `veterano` (no depende de ningún trigger de resultado) se evalúa además
de forma perezosa: al consultar el perfil, si no lo tiene desbloqueado y ya
cumple la antigüedad, se le otorga en ese momento (mismo
`insert ... on conflict do nothing`, sin necesidad de un job periódico).

**4. Idempotencia y sin revocación**

Todos los inserts son `on conflict do nothing`: un logro obtenido nunca se
quita, incluso si la condición que lo originó deja de cumplirse después (ej.
alguien pierde el primer puesto semanal tras un recálculo). Es un
"lo lograste en su momento", no un estado en vivo — coherente con que
`user_achievements.unlocked_at` es una fecha de hecho consumado.

**5. Resumen de estadísticas de perfil, transversal a grupos**

Las funciones de standings existentes (`pickem_weekly_standings`,
`pickem_season_standings`) reciben `group_id` porque las tablas de
posiciones son por grupo. El header de perfil, en cambio, es transversal:
nueva función `profile_pickem_summary(p_user_id uuid)` (`security definer`,
solo el propio usuario o admin) que agrega aciertos totales y porcentaje de
acierto sobre todos los `weekly_access` aprobados del usuario, sin importar
el grupo.

**6. RLS de `user_achievements`: solo lectura propia**

Policy `select`: `user_id = auth.uid() OR is_platform_admin(auth.uid())`. No
se expone lectura de logros de otros miembros del grupo en v1 (ver
Non-Goals) — evita resolver membership de grupo en la policy.

**7. Rediseño de `ProfilePage.tsx` en 3 bloques**

- **Header "stat card":** avatar con iniciales (se mantiene), nombre, y a la
  derecha/debajo las cifras de `profile_pickem_summary` en `--font-mono`
  grande + label en `--font-display` (Bebas Neue), sobre `.glass-surface` —
  mismo patrón que ya define `doc/design-system.md` para esta sección.
- **Grid de logros:** nuevo componente `AchievementBadge` (mismo patrón que
  `TeamBadge`: icono/inicial + color por estado), en `--accent-gold` cuando
  está desbloqueado, atenuado (opacidad reducida, sin color) cuando no,
  con tooltip/descripción del logro. Sin tiers (bronce/plata/oro) en v1 —
  la paleta extendida mencionada en `doc/design-system.md` para podios no
  está definida como tokens todavía; se evita inventarla fuera de ese
  documento.
- **Accesos rápidos existentes:** los `ActionCard` de cambio de contraseña y
  acceso a Pickem Semanal se mantienen debajo, sin cambios de lógica.

Nuevo puerto `AchievementsRepository`, entidad `Achievement`/`UserAchievement`,
casos de uso `listUserAchievements`/`getProfileStats`, hook de presentación
`useProfileAchievements`.

## Risks / Trade-offs

- [Catálogo fijo en v1 implica que agregar o ajustar un logro requiere una
  migración nueva, no hay panel admin] → Aceptado conscientemente para v1;
  revisable si el catálogo necesita iterar seguido (mismo criterio que otras
  decisiones "v1" ya tomadas en el proyecto).
- [`pickem_racha_5` requiere ordenar picks por `kickoff_at` por usuario] →
  Mitigación: se evalúa solo sobre partidos con `outcome` ya definido,
  disparado incrementalmente por el mismo trigger de resultado; volumen bajo
  (temporada ~18 semanas, grupos privados chicos) — mismo criterio de "barato
  al volumen esperado" ya usado en `modulo-survivor`.
- [No revocar logros puede mostrar como "logrado" algo que ya no es cierto en
  el presente, ej. `pickem_lider_semana` de una semana donde después se
  corrigió un resultado] → Aceptado: se documenta como "lo lograste en ese
  momento", igual criterio que otros datos históricos del proyecto (ej.
  `first_loss_week_id` de Survivor no se recalcula como "estado en vivo").
- [Mostrar solo logros propios le resta el componente social de ver logros de
  otros miembros] → Aceptado para v1, simplifica RLS; ampliable después si se
  pide.

## Migration Plan

- Tablas nuevas (`achievements`, `user_achievements`), sin datos previos que
  migrar. Requiere `base-plataforma`, `modulo-pickem-semanal` y
  `modulo-survivor` ya aplicados.
- Rollback: eliminar `user_achievements`, `achievements`, las funciones de
  evaluación/resumen nuevas y los triggers agregados; no afecta otras
  capabilities (solo lectura de sus tablas).
