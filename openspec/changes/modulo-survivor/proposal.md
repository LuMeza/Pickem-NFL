## Why

Survivor es el segundo módulo de juego del producto (Módulo 2 del requerimiento):
un pool de eliminación donde cada usuario elige un equipo ganador por semana, sin
poder repetir equipo en toda la temporada, con hasta 2 vidas extra gratuitas antes
de quedar eliminado definitivamente. Depende de la base ya propuesta en
`base-plataforma` (usuarios, grupos, catálogo NFL con `kickoff_at`, resultados
oficiales).

## What Changes

- Predicción semanal de Survivor: cada usuario elige un equipo por semana como
  ganador; bloqueo de edición una vez que el partido de ese equipo inició.
- Restricción de no repetición: un equipo no puede volver a elegirse por el mismo
  usuario en ninguna semana de la temporada.
- Vidas: cada usuario inicia con su "vida original"; si el equipo elegido pierde,
  el sistema aplica automáticamente una vida extra (hasta 2 disponibles) y el
  usuario continúa jugando la siguiente semana; si ya no tiene vidas extra
  disponibles, queda eliminado definitivamente.
- Cálculo de estado por usuario y semana: vivo, eliminado, o "vida extra usada" en
  esa transición.
- Historial de equipos ya utilizados por usuario, para bloquear repeticiones.
- Ranking de supervivencia por grupo, con podio de 1er, 2do y 3er lugar según el
  orden en que los usuarios quedan eliminados definitivamente (último en caer =
  1er lugar).
- Desempate cuando dos o más usuarios quedan eliminados definitivamente en la misma
  semana para una misma posición del podio: gana (queda en mejor posición) quien
  duró más semanas con su vida original, antes de usar cualquier vida extra, sin
  importar cuánto duraron después con las vidas extra.

## Capabilities

### New Capabilities
- `prediccion-survivor`: registro de la elección semanal de equipo, restricción de
  no repetición de equipo en la temporada, bloqueo al iniciar el partido.
- `estado-survivor`: procesamiento de resultados para determinar vidas usadas,
  eliminación, ranking de supervivencia con podio de 3 lugares y desempate por
  duración con vida original.

### Modified Capabilities
(ninguna)

## Impact

- Requiere que `base-plataforma` esté implementada.
- Nuevas tablas propias del módulo (elecciones semanales, estado de supervivencia
  por usuario) — detalladas en `design.md`.
- No afecta a Quiniela Semanal ni a Playoffs.
