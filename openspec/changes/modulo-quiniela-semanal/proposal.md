## Why

La Quiniela Semanal es el primer módulo de juego del producto (Módulo 1 del
requerimiento): permite a los miembros de un grupo predecir ganadores partido a
partido, semana a semana, desde pretemporada hasta el arranque de playoffs.
Depende directamente de la base ya propuesta en `base-plataforma` (usuarios,
grupos, acceso por módulo, catálogo NFL, resultados oficiales), que debe estar
implementada antes de construir este módulo.

## What Changes

- Predicción semanal: cada usuario con acceso aprobado a la quiniela semanal del
  grupo predice, por cada partido de la semana, qué equipo gana o si empatan.
- Bloqueo de edición de una predicción una vez que el partido correspondiente ya
  inició (usa `games.kickoff_at` del catálogo base).
- Cálculo automático de aciertos por usuario y por semana, apenas el resultado
  oficial de un partido está disponible.
- Tabla de posiciones semanal (aciertos de la semana) y tabla de posiciones
  acumulada de temporada, visibles según lo que el admin del grupo permita ver a
  usuarios sin acceso aprobado.
- Cierre automático del módulo en cuanto arranca la ronda de playoffs: deja de
  generarse predicción para semanas nuevas; la tabla acumulada queda congelada
  como resultado final de la quiniela semanal.
- Determinación de ganador de temporada: usuario(s) con más aciertos acumulados al
  cierre; empate en primer lugar se reporta como empate (sin desempate automático).

## Capabilities

### New Capabilities
- `prediccion-quiniela-semanal`: registro de predicciones (ganador o empate) por
  partido y por semana, con bloqueo al iniciar el partido, condicionado a acceso
  aprobado del usuario en el grupo.
- `tabla-quiniela-semanal`: cálculo de aciertos, tabla semanal, tabla acumulada de
  temporada, cierre automático al iniciar playoffs y determinación del ganador
  (o empate) de temporada.

### Modified Capabilities
(ninguna — no cambia el comportamiento de `auth-usuarios`, `grupos-privados`,
`catalogo-nfl` ni `carga-resultados`; solo se construye sobre ellas)

## Impact

- Requiere que `base-plataforma` esté implementada (tablas de grupos, acceso por
  módulo, catálogo NFL con `kickoff_at`, y resultados oficiales).
- Nuevas tablas propias del módulo (predicciones, snapshot de tabla si aplica) —
  detalladas en `design.md`.
- No afecta a Survivor ni a Playoffs, que se proponen como changes separados.
