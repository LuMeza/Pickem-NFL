## Why

La Pickem Semanal es el primer módulo de juego del producto (Módulo 1 del
requerimiento): permite a los miembros de un grupo predecir ganadores partido a
partido, semana a semana, desde pretemporada hasta el arranque de playoffs.
Depende directamente de la base ya propuesta en `base-plataforma` (usuarios,
grupos, acceso por módulo, catálogo NFL, resultados oficiales), que debe estar
implementada antes de construir este módulo.

## What Changes

- Acceso semanal (no por módulo): a diferencia del modelo genérico de
  `module_access` de `base-plataforma` (acceso único por temporada), la Pickem
  Semanal se juega semana a semana — cada usuario solicita entrar a la pickem
  de una semana puntual y el administrador de plataforma aprueba o rechaza esa
  solicitud, hasta el kickoff del primer partido de esa semana. Survivor y
  Playoffs no se ven afectados y siguen usando `module_access` tal como está
  definido en `base-plataforma`.
- Predicción semanal: cada usuario con acceso semanal aprobado para esa semana
  predice, por cada partido de la semana, qué equipo gana o si empatan.
- Bloqueo de edición de una predicción una vez que el partido correspondiente ya
  inició (usa `games.kickoff_at` del catálogo base).
- Cálculo automático de aciertos por usuario y por semana, apenas el resultado
  oficial de un partido está disponible.
- Tabla de posiciones semanal (aciertos de la semana) y tabla de posiciones
  acumulada de temporada, visibles según lo que el administrador de plataforma permita ver a
  usuarios sin acceso aprobado.
- Cierre automático del módulo en cuanto arranca la ronda de playoffs: deja de
  generarse predicción para semanas nuevas; la tabla acumulada queda congelada
  como resultado final de la pickem semanal.
- Determinación de ganador de temporada: usuario(s) con más aciertos acumulados al
  cierre; empate en primer lugar se reporta como empate (sin desempate automático).

## Capabilities

### New Capabilities
- `acceso-semanal-pickem`: solicitud y aprobación/rechazo de acceso a la
  pickem de una semana puntual, gestionable por el administrador de
  plataforma, con corte en el kickoff del primer partido de esa semana.
  Reemplaza, solo para este módulo, el uso del modelo genérico de acceso por
  módulo de `grupos-privados`.
- `prediccion-pickem-semanal`: registro de predicciones (ganador o empate) por
  partido y por semana, con bloqueo al iniciar el partido, condicionado a acceso
  semanal aprobado del usuario para esa semana.
- `tabla-pickem-semanal`: cálculo de aciertos, tabla semanal, tabla acumulada de
  temporada, cierre automático al iniciar playoffs y determinación del ganador
  (o empate) de temporada.

### Modified Capabilities
(ninguna — no cambia el comportamiento de `auth-usuarios`, `catalogo-nfl` ni
`carga-resultados`; solo se construye sobre ellas. `grupos-privados` tampoco se
modifica: su modelo genérico de `module_access` sigue vigente para Survivor y
Playoffs, simplemente este módulo no lo usa)

## Impact

- Requiere que `base-plataforma` esté implementada (grupos, catálogo NFL con
  `kickoff_at`, y resultados oficiales). No depende de `module_access` para este
  módulo específico.
- Nuevas tablas propias del módulo: `weekly_access` (solicitud/aprobación por
  semana) y predicciones (`weekly_picks`) — detalladas en `design.md`.
- No afecta a Survivor ni a Playoffs, que se proponen como changes separados y
  siguen usando `module_access` de `base-plataforma` sin cambios.
