## Context

Playoffs introduce una mecánica de predicción distinta a los otros dos módulos
(rango de diferencia de puntos en vez de solo ganador/equipo), y requiere una
regla explícita para el caso límite de una diferencia de exactamente 6 puntos, que
el requerimiento no cubre literalmente. Amerita decisiones de diseño antes de
specs/tasks.

## Goals / Non-Goals

**Goals:**
- Definir el modelo de datos de predicciones de playoffs y la regla exacta para
  clasificar un resultado oficial en una de las 3 opciones (local amplio,
  cerrado, visita amplio), incluyendo el caso límite de diferencia = 6.
- Definir el cálculo de aciertos y el ranking final con podio de 3 lugares.

**Non-Goals:**
- No se define reparto de dinero entre los 3 lugares premiados (fuera de la
  plataforma).
- No se modifica el cierre automático de la Quiniela Semanal (ya definido en
  `modulo-pickem-semanal`); este change solo agrega el módulo de Playoffs.

## Decisions

**1. Opciones de predicción como enum `local_amplio | cerrado | visita_amplio`**
Corresponde a: "Local: gana por más de 6 puntos" → `local_amplio`; "Diferencia:
gana por menos de 6 puntos (partido cerrado)" → `cerrado` (no requiere indicar
qué equipo gana, solo que el margen es angosto); "Visita: gana por más de 6
puntos" → `visita_amplio`.

**2. Regla de clasificación del resultado oficial (incluye caso límite de 6
puntos)**
Con `margin = abs(home_score - away_score)`:
- Si el equipo local ganó y `margin > 6` → resultado oficial clasifica como
  `local_amplio`.
- Si el equipo visitante ganó y `margin > 6` → resultado oficial clasifica como
  `visita_amplio`.
- En cualquier otro caso (incluye empate, y **`margin <= 6` para cualquiera de
  los dos equipos, incluyendo exactamente 6**) → resultado oficial clasifica
  como `cerrado`. Se decide incluir el margen exacto de 6 en "cerrado" porque el
  requerimiento define el umbral amplio como estrictamente "más de 6 puntos".
- Un acierto = la predicción del usuario coincide exactamente con esta
  clasificación de 3 valores.

**3. Tabla `playoff_picks` (una fila por usuario+partido)**
Columnas: `group_id`, `user_id`, `game_id`, `pick`
(`local_amplio | cerrado | visita_amplio`), timestamps. Mismo patrón que
`weekly_picks` de la Quiniela Semanal.

**4. Aciertos y ranking calculados on-the-fly (vista SQL)**
Mismo enfoque que la Quiniela Semanal: sin tabla materializada, se compara
`playoff_picks` contra la clasificación derivada del resultado oficial en
`games` para partidos de semanas de tipo `playoffs`.

**5. Podio de 3 lugares por total de aciertos de toda la ronda de playoffs, con
empate compartido**
El ranking final ordena a los usuarios por aciertos totales de playoffs. Si dos o
más usuarios empatan para cualquiera de las 3 posiciones del podio, se reportan
todos como empatados en esa posición, sin regla de desempate (igual que Quiniela
Semanal).

## Risks / Trade-offs

- [La regla de "cerrado" para margen = 6 puede no coincidir con lo que el dueño
  del producto tenía en mente] → Documentado explícitamente como decisión
  tomada para eliminar la ambigüedad del requerimiento original; fácil de
  ajustar si se corrige antes de implementar.

## Migration Plan

- No hay datos previos de este módulo. Requiere que las migraciones de
  `base-plataforma` ya estén aplicadas (incluye `home_score`/`away_score` en
  `games`).
- Rollback: eliminar `playoff_picks` y sus policies; no afecta a otras
  capabilities.
