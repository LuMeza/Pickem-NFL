## Context

Este change sienta la base de datos y de acceso sobre la que se construirán los tres
módulos de juego (Quiniela Semanal, Survivor, Playoffs), cada uno propuesto como un
change independiente más adelante. Es una decisión cross-cutting (define el modelo de
datos y el modelo de permisos que todo lo demás va a usar) y con dependencias nuevas
(Supabase), por lo que amerita design doc antes de escribir specs/tasks.

## Goals / Non-Goals

**Goals:**
- Definir el esquema de datos mínimo compartido: usuarios, grupos, membresías,
  equipos NFL, semanas (incluida pretemporada) y partidos con sus resultados.
- Definir el modelo de permisos (RLS) para que los datos de un grupo solo sean
  visibles para sus miembros, y que solo el administrador de plataforma pueda
  escribir (crear grupos, gestionar miembros, cargar resultados).
- Definir cómo se dan de alta los usuarios (sin registro público — alta manual por
  el administrador con contraseña provisional y cambio obligatorio en el primer
  login) y cómo se otorga acceso a un grupo (invitación por link/código generado
  por el administrador).
- Definir cómo el administrador aprueba solicitudes de acceso a módulos opt-in
  (usado por Quiniela Semanal en un change futuro, pero el modelo de "estado de
  acceso" se define aquí porque es genérico a nivel grupo↔módulo).
- Dejar el modelo de partidos/resultados listo para que los módulos de juego solo
  necesiten agregar sus propias tablas de predicciones referenciando `games`.

**Non-Goals:**
- No se implementa ninguna lógica de predicciones, cálculo de aciertos ni rankings
  (eso vive en los changes de cada módulo).
- No se implementa integración con API deportiva externa para resultados — solo
  carga manual por el administrador, con el modelo de datos abierto a integrarla
  después.
- No se implementa envío de correos desde la plataforma (ni para alta de usuario ni
  para invitaciones) — toda entrega de credenciales/links ocurre fuera del sistema.
- No se implementa el perfil de usuario "avanzado" (estadísticas agregadas entre
  módulos) ni notificaciones — quedan para changes posteriores.
- No se implementa cobro, pago ni distribución de premios (fuera de alcance del
  producto completo, no solo de este change).
- No se implementa delegación de administración (múltiples administradores) — hay
  exactamente un administrador de plataforma en esta fase.

## Decisions

**1. Supabase como backend único (Postgres + Auth + RLS)**
En vez de un backend custom, se usa Supabase directamente desde el cliente React con
Row Level Security como capa de autorización. Alternativa considerada: API propia en
Node — se descarta por velocidad de desarrollo dado el tamaño del equipo (proyecto
personal/grupos privados, no requiere lógica de servidor compleja al inicio).
Edge Functions se reservan para lo que RLS no pueda expresar (ej. cálculo de
rankings en changes futuros).

**2. Un único rol administrativo, global: tabla `platform_admins`**
No existe rol "owner" por grupo. `platform_admins` es una lista de `user_id` con
permiso administrativo total (dar de alta usuarios, crear grupos, administrar
miembros de cualquier grupo, aprobar accesos a módulos, cargar resultados del
catálogo NFL). En v1 tiene una sola fila (un solo administrador), poblada
manualmente en la base de datos; el esquema no impide agregar más filas en el
futuro si se decide delegar. `group_members` no tiene columna `role` — pertenecer
a la tabla es simplemente ser miembro; los permisos de administración se resuelven
consultando `platform_admins`, no el grupo.

**3. Alta de usuario por el administrador, sin registro público**
No hay pantalla de sign-up. El administrador crea el usuario desde el panel admin;
esto requiere la Supabase Admin API (`auth.admin.createUser`), que exige la
service role key y por lo tanto SHALL ejecutarse en una Edge Function (nunca desde
el cliente). La función genera una contraseña provisional, crea el usuario y su
fila en `profiles` con `must_change_password = true`, y devuelve la contraseña una
sola vez para que el administrador la copie y la entregue fuera de la plataforma
(no se envían correos). En el primer login exitoso con esa contraseña, la app
SHALL forzar el cambio de contraseña antes de permitir cualquier otra navegación;
al completarse, se actualiza `must_change_password = false`.

**4. Modelo de acceso a grupo vs. acceso a módulo, en dos niveles**
- `group_members`: pertenecer al grupo (puede ver info general, tablas si el
  administrador lo permite).
- `module_access`: fila por (grupo, usuario, módulo) con estado
  `solicitado | aprobado | rechazado`, para modelar el flujo opt-in de la Quiniela
  Semanal (solicitud → aprobación del administrador) sin acoplar esa lógica a la
  tabla de membresía del grupo. Survivor y Playoffs pueden usar la misma tabla si
  en el futuro también requieren aprobación, o simplemente no generar filas
  (acceso implícito por ser miembro) — se decide por módulo en su propio change.

**5. Invitación por link/código con tabla `group_invites`, generado solo por el
administrador**
Un código corto (ej. 8 caracteres alfanuméricos) por grupo, generado al crear el
grupo y regenerable por el administrador, sin expiración obligatoria en esta
primera versión (se puede agregar `expires_at` luego sin romper el esquema). El
link de invitación embebe el código. Un usuario ya dado de alta (con cuenta
existente) que abre el link o ingresa el código se agrega a sí mismo como miembro
mediante una función controlada (SECURITY DEFINER / RPC) que valida el código —
no requiere que el administrador lo agregue manualmente uno por uno.

**6. Semanas como entidad explícita (`weeks`), no solo un número**
`weeks` incluye tipo (`pretemporada | regular | playoffs`) y número, para soportar
"Pre Sem. 1/2/3" y el cierre automático de la Quiniela Semanal en cuanto arranca
playoffs (se detecta por `type = 'playoffs'`). `games` referencia `weeks` y `teams`
(local/visita) y guarda el resultado oficial (ganador, o marcador si se decide
guardarlo para soportar el cálculo de diferencia de puntos de Playoffs).

**7. RLS por pertenencia a grupo, con bypass total para `platform_admins`**
Todas las tablas con datos de grupo (`group_members`, `module_access`,
`group_invites`) filtran por `auth.uid()` perteneciente a `group_members` del grupo
correspondiente para lectura; toda escritura (crear grupo, agregar/remover
miembros, aprobar/rechazar acceso a módulo) SHALL requerir que `auth.uid()` esté en
`platform_admins`, salvo la auto-unión vía código de invitación (decisión 5), que
es la única escritura que un `member` puede hacer sobre sí mismo. `teams`, `weeks`,
`games` son de lectura pública para cualquier autenticado (mismos datos para todos
los grupos, es el catálogo NFL); su escritura también se restringe a
`platform_admins`.

## Risks / Trade-offs

- [RLS mal configurada expone datos de un grupo a otro] → Cubrir con specs de
  requisitos explícitos por capability y pruebas de policies antes de construir
  módulos sobre esta base.
- [Carga manual de resultados es lenta/propensa a error humano] → Aceptado para
  esta fase (el requerimiento la marca como válida); dejar el esquema compatible
  con una futura fuente automática sin migración destructiva.
- [Modelo de `module_access` genérico puede no encajar igual para los 3 módulos] →
  Se revisa y ajusta (delta spec) cuando se proponga cada change de módulo, en vez
  de sobre-diseñarlo ahora sin conocer el detalle fino de cada uno.
- [Un solo administrador es un punto único de fallo operativo (si pierde acceso,
  nadie más puede dar de alta usuarios o cargar resultados)] → Aceptado
  explícitamente para v1 según lo pedido; el esquema (`platform_admins` como
  tabla, no como valor hardcodeado) permite agregar un segundo administrador más
  adelante sin migración estructural.
- [La Edge Function de alta de usuario maneja la service role key, que tiene
  permisos totales sobre el proyecto Supabase] → Debe invocarse solo desde el
  panel admin autenticado, verificando `auth.uid()` contra `platform_admins`
  dentro de la función antes de usar la service role key.

## Migration Plan

- No aplica migración de datos existentes (proyecto nuevo). El "deploy" es la
  creación inicial del proyecto Supabase y ejecución de las migraciones SQL que
  generen las tablas descritas, versionadas en el repo (carpeta `supabase/migrations`).
- Rollback: al no haber datos productivos aún, rollback es simplemente no aplicar o
  revertir la migración correspondiente.

## Open Questions (resueltas para v1)

- **¿Un grupo puede tener más de un administrador, o hay owners por grupo?** No:
  hay un único administrador de plataforma (`platform_admins`), sin rol de owner
  por grupo — confirmado explícitamente por el dueño del producto ("solo hay un
  administrador, nadie puede crear grupos aparte").
- **¿Cómo se determina un "administrador de plataforma" para cargar resultados
  oficiales del catálogo NFL (global, no por grupo) y para el resto de acciones
  administrativas?** La misma tabla `platform_admins` (lista explícita de
  `user_id`) se usa para todo: catálogo NFL, alta de usuarios, creación de
  grupos, administración de miembros y aprobación de accesos a módulo — un solo
  administrador con permiso total, poblado manualmente en la base de datos para
  v1 (sin UI de autoservicio para agregar más administradores).
- **¿Se guarda marcador exacto en `games`?** Sí, desde este change: columnas
  `home_score`/`away_score` nullable, para que el módulo de Playoffs (diferencia
  de puntos) no requiera migrar el catálogo compartido más adelante.
- **¿Cómo se determina si un partido ya inició (para bloquear predicciones)?**
  `games` incluye `kickoff_at` (timestamp). Los tres módulos de juego (Quiniela
  Semanal, Survivor, Playoffs) usan esta misma columna para bloquear/permitir
  la edición de una predicción, en vez de que cada módulo defina su propia
  noción de "cierre".
