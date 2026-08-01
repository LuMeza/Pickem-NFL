## Why

Playoffs es el tercer módulo de juego del producto (Módulo 3 del requerimiento):
cubre todos los partidos de la ronda de playoffs con una mecánica de predicción
distinta a los otros módulos (por rango de diferencia de puntos, no solo ganador).
Reemplaza a la Quiniela Semanal en cuanto arranca playoffs. Depende de la base ya
propuesta en `base-plataforma` (catálogo NFL con marcador oficial `home_score`/
`away_score` y `kickoff_at`).

## What Changes

- Predicción por partido de playoffs con 3 opciones: el local gana por más de 6
  puntos, partido cerrado (diferencia de menos de 6 puntos, sin importar quién
  gane), o la visita gana por más de 6 puntos.
- Bloqueo de edición de una predicción una vez que el partido correspondiente ya
  inició (usa `games.kickoff_at`).
- Cálculo automático de aciertos por usuario a partir del marcador oficial
  (`home_score`/`away_score`) de cada partido de playoffs.
- Tabla de resultados por ronda de playoffs y ranking final de temporada del
  módulo, con podio de 1er, 2do y 3er lugar por grupo según el total de aciertos
  de toda la ronda de playoffs.
- Empate en aciertos para cualquiera de las 3 posiciones del podio se reporta como
  empate compartido, sin regla de desempate automática.

## Capabilities

### New Capabilities
- `prediccion-playoffs`: registro de predicciones por rango de diferencia de
  puntos para partidos de playoffs, con bloqueo al iniciar el partido.
- `tabla-playoffs`: cálculo de aciertos a partir del marcador oficial, tabla de
  resultados por ronda y ranking final con podio de 3 lugares y manejo de
  empates.

### Modified Capabilities
(ninguna)

## Impact

- Requiere que `base-plataforma` esté implementada, incluyendo `home_score`/
  `away_score` en `games`.
- Nuevas tablas propias del módulo (predicciones de playoffs) — detalladas en
  `design.md`.
- No afecta a Quiniela Semanal ni a Survivor. La relación con Quiniela Semanal es
  solo temporal (Quiniela Semanal deja de generar semanas nuevas al arrancar
  playoffs, según su propio spec en `modulo-pickem-semanal`); este change no
  modifica esa capability.
