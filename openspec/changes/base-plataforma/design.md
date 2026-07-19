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
  visibles/editables por sus miembros y su admin.
- Definir cómo se otorga acceso a un grupo (invitación por link/código) y cómo el
  admin aprueba solicitudes de acceso a módulos opt-in (usado por Quiniela Semanal
  en un change futuro, pero el modelo de "estado de acceso" se define aquí porque es
  genérico a nivel grupo↔módulo).
- Dejar el modelo de partidos/resultados listo para que los módulos de juego solo
  necesiten agregar sus propias tablas de predicciones referenciando `games`.

**Non-Goals:**
- No se implementa ninguna lógica de predicciones, cálculo de aciertos ni rankings
  (eso vive en los changes de cada módulo).
- No se implementa integración con API deportiva externa para resultados — solo
  carga manual por admin, con el modelo de datos abierto a integrarla después.
- No se implementa el perfil de usuario "avanzado" (estadísticas agregadas entre
  módulos) ni notificaciones — quedan para changes posteriores.
- No se implementa cobro, pago ni distribución de premios (fuera de alcance del
  producto completo, no solo de este change).

## Decisions

**1. Supabase como backend único (Postgres + Auth + RLS)**
En vez de un backend custom, se usa Supabase directamente desde el cliente React con
Row Level Security como capa de autorización. Alternativa considerada: API propia en
Node — se descarta por velocidad de desarrollo dado el tamaño del equipo (proyecto
personal/grupos privados, no requiere lógica de servidor compleja al inicio).
Edge Functions se reservan para lo que RLS no pueda expresar (ej. cálculo de
rankings en changes futuros).

**2. Modelo de acceso a grupo vs. acceso a módulo, en dos niveles**
- `group_members`: pertenecer al grupo (puede ver info general, tablas si el admin
  lo permite).
- `module_access`: fila por (grupo, usuario, módulo) con estado
  `solicitado | aprobado | rechazado`, para modelar el flujo opt-in de la Quiniela
  Semanal (solicitud → aprobación del admin) sin acoplar esa lógica a la tabla de
  membresía del grupo. Survivor y Playoffs pueden usar la misma tabla si en el
  futuro también requieren aprobación, o simplemente no generar filas (acceso
  implícito por ser miembro) — se decide por módulo en su propio change.

**3. Invitación por link/código con tabla `group_invites`**
Un código corto (ej. 8 caracteres alfanuméricos) por grupo, regenerable por el admin,
sin expiración obligatoria en esta primera versión (se puede agregar `expires_at`
luego sin romper el esquema). El link de invitación embebe el código.

**4. Roles: `owner` (creador del grupo) y `member`**
Se modela como columna `role` en `group_members` en vez de tabla de roles separada,
por simplicidad — el único rol especial en esta fase es "admin de grupo" (puede haber
más de uno si el owner delega, ver Open Questions).

**5. Semanas como entidad explícita (`weeks`), no solo un número**
`weeks` incluye tipo (`pretemporada | regular | playoffs`) y número, para soportar
"Pre Sem. 1/2/3" y el cierre automático de la Quiniela Semanal en cuanto arranca
playoffs (se detecta por `type = 'playoffs'`). `games` referencia `weeks` y `teams`
(local/visita) y guarda el resultado oficial (ganador, o marcador si se decide
guardarlo para soportar el cálculo de diferencia de puntos de Playoffs).

**6. RLS por pertenencia a grupo**
Todas las tablas con datos de grupo (`group_members`, `module_access`,
`group_invites`) filtran por `auth.uid()` perteneciente a `group_members` del grupo
correspondiente. `teams`, `weeks`, `games` son de lectura pública (mismos datos para
todos los grupos, es el catálogo NFL); escritura restringida a admins vía policy
basada en una tabla/claim de "admin de plataforma" para carga de resultados (ver
Open Questions — puede resolverse con un claim en Supabase Auth o tabla
`platform_admins`).

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

## Migration Plan

- No aplica migración de datos existentes (proyecto nuevo). El "deploy" es la
  creación inicial del proyecto Supabase y ejecución de las migraciones SQL que
  generen las tablas descritas, versionadas en el repo (carpeta `supabase/migrations`).
- Rollback: al no haber datos productivos aún, rollback es simplemente no aplicar o
  revertir la migración correspondiente.

## Open Questions (resueltas para v1)

- **¿Un grupo puede tener más de un admin?** No en v1: `role` es `owner | member`,
  solo el creador del grupo (owner) administra miembros y accesos — coincide
  literal con el requerimiento ("administración de miembros por el creador del
  grupo"). Delegar a más admins queda abierto para un change futuro si se pide.
- **¿Cómo se determina un "admin de plataforma" para cargar resultados oficiales
  del catálogo NFL (global, no por grupo)?** Se crea tabla `platform_admins`
  (lista explícita de `user_id` con permiso de escritura sobre `teams`/`weeks`/
  `games`), poblada manualmente en la base de datos para v1 (sin UI de
  autoservicio). Evita que el rol de "owner de un grupo" otorgue implícitamente
  permiso sobre un catálogo compartido entre grupos.
- **¿Se guarda marcador exacto en `games`?** Sí, desde este change: columnas
  `home_score`/`away_score` nullable, para que el módulo de Playoffs (diferencia
  de puntos) no requiera migrar el catálogo compartido más adelante.
- **¿Cómo se determina si un partido ya inició (para bloquear predicciones)?**
  `games` incluye `kickoff_at` (timestamp). Los tres módulos de juego (Quiniela
  Semanal, Survivor, Playoffs) usan esta misma columna para bloquear/permitir
  la edición de una predicción, en vez de que cada módulo defina su propia
  noción de "cierre".
