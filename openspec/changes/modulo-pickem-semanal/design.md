## Context

Este change agrega el primer módulo de juego sobre la base de `base-plataforma`.
Introduce una nueva tabla (predicciones) y lógica de cálculo de aciertos/tabla de
posiciones — suficientemente nuevo como para requerir decisiones técnicas antes de
escribir specs/tasks.

## Goals / Non-Goals

**Goals:**
- Definir el modelo de datos de predicciones semanales y su relación con
  `games` y `group_members`.
- Definir el modelo de acceso semanal (solicitud/aprobación por semana), que
  reemplaza al modelo genérico de `module_access` para este módulo específico.
- Definir cómo se calculan aciertos y tabla de posiciones (on-the-fly vs.
  materializado) sin sobre-ingeniería para un producto de grupos privados chicos.
- Definir el mecanismo de cierre automático al iniciar playoffs.

**Non-Goals:**
- No se implementa Survivor ni Playoffs (changes separados).
- No se implementa ningún reparto de dinero — el sistema solo reporta empate en el
  primer lugar; el reparto ocurre fuera de la plataforma.
- No se implementa una regla de desempate automática (el requerimiento indica
  explícitamente que no debe haberla para este módulo).

## Decisions

**1. Tabla `weekly_picks` (una fila por usuario+partido)**
Columnas: `game_id`, `user_id`, `group_id`, `pick` (`home | away | tie`),
`created_at`/`updated_at`. Se incluye `group_id` aunque sea derivable de
`weekly_access`/`group_members`, para que las policies de RLS y las queries de
tabla de posiciones sean directas por grupo sin joins adicionales.

**2. Aciertos y tabla de posiciones calculados on-the-fly (vista SQL), no
materializados**
Dado el tamaño esperado (grupos privados chicos, temporada de ~20 semanas), se
calcula la tabla de posiciones con una vista/consulta que compara `weekly_picks`
contra el resultado oficial en `games`. Evita mantener un job de recálculo o
tablas derivadas desincronizadas. Si el rendimiento lo exige más adelante, se
puede materializar sin cambiar el contrato de la capability (detalle de
implementación, no de spec).

**3. Empate como valor válido de `pick`**
`pick` es un enum `home | away | tie`, igual que el resultado oficial en `games`
(que ya soporta empate según `base-plataforma`). Un acierto = `pick` coincide
exactamente con el resultado oficial.

**4. Bloqueo de edición por bloque de días de la semana (actualizado 2026-08-12)**
Decisión original (2026-07-19): una predicción era editable mientras
`now() < games.kickoff_at` de ese partido puntual. Se reemplazó dos veces:

- Primero (`20260812000002_fix_weekly_pick_locks_at_week_kickoff.sql`) por un
  cierre de toda la semana junta en el kickoff del partido más temprano de la
  semana — igual criterio que ya usaba Survivor
  (`public.week_kickoff_started`).
- Luego, por cambio de criterio de producto
  (`20260812000003_weekly_pick_locks_by_day_block.sql`), por el esquema
  vigente: cada semana se divide en dos bloques de días — "entre semana"
  (cualquier día que no sea sábado/domingo/lunes) y "fin de semana"
  (sábado/domingo/lunes) — y cada bloque cierra por separado, en el kickoff
  de su propio partido más temprano. El día se calcula en `America/New_York`
  (huso de la NFL), no en UTC ni en el huso del usuario, para que un Monday
  Night que cruza medianoche UTC no se clasifique como martes.

Fuente de verdad: función `public.weekly_pick_group_deadline(week_id,
kickoff_at)` + `public.can_pick_game`, aplicada tanto en la policy/constraint
de base de datos como en el cliente (`frontend/src/core/rules/weeklyPickGroupDeadline.ts`)
para dar feedback inmediato sin depender solo de la UI.

**5. Cierre automático = dejar de aceptar predicciones para semanas de tipo
`playoffs`**
No se "cierra" con un flag manual: la propia semántica de `weeks.type` (de
`catalogo-nfl`) determina que `weekly_picks` solo acepta filas para partidos de
semanas `hof`, `pretemporada` o `regular` (ver change `agregar-semana-hof`). La
tabla acumulada de temporada, una vez que
existe al menos una semana de playoffs iniciada, se interpreta como el resultado
final del módulo (no requiere una tabla de snapshot separada).

**6. Ganador de temporada = mayor total de aciertos acumulados; empate se reporta,
no se resuelve**
Se calcula ordenando la tabla acumulada; si hay empate en el primer puesto, la
capability expone esa lista de usuarios empatados tal cual, sin lógica de
desempate (coincide con el requerimiento).

**7. Acceso semanal con tabla propia `weekly_access` — ELIMINADA el 2026-08-12**
Decisión original (2026-07-19): `base-plataforma` define `module_access` con
grano `(group_id, user_id, module)` — un estado por temporada. Para la Pickem
Semanal ese grano no alcanzaba, así que se introdujo una tabla propia
`weekly_access` (`group_id`, `user_id`, `week_id`, `status`
`solicitado | aprobado | rechazado`) para que el administrador aprobara el
acceso semana a semana, normalmente después de confirmar el pago del pozo
fuera de la plataforma.

En la práctica esa aprobación no aportaba control real (el cobro ya se
verificaba fuera de la plataforma) y era pura fricción operativa para el
administrador. Se eliminó por completo
(`supabase/migrations/20260812000000_remove_weekly_access_approval.sql`): la
tabla `weekly_access` se dropeó, y cualquier miembro del grupo puede
registrar picks libremente. Ver capability `acceso-semanal-pickem`
(`## REMOVED Requirements`) y decisión 4 (bloqueo por bloque de días) para el
único criterio de corte que sigue vigente.

**8. Tablas de posiciones vía funciones SQL `SECURITY DEFINER`, con
visibilidad guardada en `pickem_settings`**
Las policies de RLS de `weekly_picks` solo dejan leer las filas propias
(decisión 1), pero la tabla de posiciones necesita agregar los aciertos de
todos los usuarios del grupo. En vez de relajar esa policy, se agregan
funciones `SECURITY DEFINER` (`pickem_weekly_standings`,
`pickem_season_standings`) que reimplementan el control de acceso
internamente (`can_view_pickem_tables`): visible para `platform_admins`,
para cualquier usuario que registró al menos un pick alguna vez en el grupo,
o para todos si el administrador lo habilita explícitamente. Ese flag se
guarda en una tabla, `pickem_settings` (`group_id` primary key,
`tables_visible_to_all boolean default false`) — un registro de configuración
por grupo. Si la función determina que el llamante no puede ver las tablas,
devuelve cero filas (no un error); el cliente distingue "no visible" de "sin
resultados todavía" con una función auxiliar
(`can_view_pickem_tables_for_group`) invocable directo por RPC.

> Actualizado 2026-08-12
> (`supabase/migrations/20260812000001_fix_pickem_functions_after_weekly_access_removal.sql`):
> el criterio original de `can_view_pickem_tables` era "tuvo `weekly_access`
> aprobado alguna vez"; al eliminarse esa tabla (decisión 7), la nueva fuente
> de verdad de "participa en el grupo" es directamente `weekly_picks` — "hizo
> al menos un pick alguna vez" — sin cambiar el resto del contrato de la
> función.

## Risks / Trade-offs

- [Cálculo on-the-fly puede ser lento si un grupo crece mucho o hay muchas
  temporadas históricas] → Aceptado para v1 (grupos privados, volumen bajo);
  revisar materialización si se detecta problema real de performance.
- [Bloqueo de edición basado en `kickoff_at` no cubre pospuestos/reprogramaciones
  de partidos] → Fuera de alcance de v1; el admin de plataforma puede corregir
  `kickoff_at` manualmente si un partido se reprograma antes de que inicie.
- [Aprobar acceso semana a semana implica trabajo manual recurrente del
  administrador durante toda la temporada, a diferencia de una aprobación única
  por módulo] → Este riesgo se concretó: en la práctica era pura fricción sin
  control real (el pago ya se verificaba fuera de la plataforma). Resuelto
  eliminando el requisito de aprobación por completo el 2026-08-12 (ver
  decisión 7), en vez de optimizar el flujo de aprobación.

## Migration Plan

- No hay datos previos de este módulo. Requiere que las migraciones de
  `base-plataforma` ya estén aplicadas (dependencia de orden de implementación,
  no de datos).
- No se usa el módulo `'pickem_semanal'` de `module_access`: si esa fila llegó
  a existir en algún ambiente (no debería, dado que este módulo aún no tiene
  código), se elimina sin migración de datos — no hay predicciones ni historial
  que dependan de ella.
- Rollback: eliminar las tablas `weekly_access` y `weekly_picks` y sus policies;
  no afecta a otras capabilities.
