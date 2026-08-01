## Why

El calendario de pretemporada de NFL empieza con el Hall of Fame Game (ESPN
`seasontype=1, week=1`), un partido real que hoy el sistema ignora a propósito:
`catalogo-nfl` solo modela pretemporada como "Pre Sem. 1/2/3", y la
sincronización con ESPN aplica un offset de `+1` explícitamente para saltarse
ese partido (`supabase/functions/sync-espn-results/mapping.ts`). El
administrador quiere que el Hall of Fame Game sí sea un partido más dentro de
la quiniela semanal, no uno excluido del catálogo.

## What Changes

- Nuevo tipo de semana `hof` en `weeks` (junto a `pretemporada`, `regular`,
  `playoffs`), con una sola semana/número, ubicada cronológicamente antes de
  Pre Sem. 1.
- La sincronización con ESPN mapea `hof` a `seasontype=1, week=1` (el propio
  Hall of Fame Game). El mapeo de `pretemporada` (`seasontype=1, week+1`) no
  cambia — sigue apuntando a Pre Sem. 1/2/3 (ESPN weeks 2-4); antes ese offset
  existía para saltarse el Hall of Fame Game, ahora existe simplemente porque
  `hof` ya ocupa la ESPN week 1.
- El catálogo (selector de semanas, calendario por equipo) muestra `hof` como
  su propia sección, separada de pretemporada.
- La quiniela semanal (`prediccion-quiniela-semanal`, todavía no implementada
  en código) SHALL aceptar predicciones también para partidos de semanas tipo
  `hof`, no solo `pretemporada`/`regular` — se actualiza la spec para que la
  implementación futura ya lo contemple.

## Capabilities

### Modified Capabilities
- `catalogo-nfl`: el tipo de semana admite ahora `hof` además de
  `pretemporada`, `regular` y `playoffs`.
- `sincronizacion-resultados-espn`: el mapeo de semana interna → parámetros de
  ESPN cubre el nuevo tipo `hof`, en vez de tratarlo como un partido a
  ignorar.
- `prediccion-quiniela-semanal`: las semanas válidas para registrar una
  predicción pasan de `pretemporada | regular` a `hof | pretemporada |
  regular`.

## Impact

- Requiere que `base-plataforma` (tabla `weeks`) e `integracion-resultados-espn`
  (mapeo ESPN) ya estén implementadas — lo están.
- Migración aditiva sobre `weeks.type` (amplía el `check` constraint) y un
  nuevo valor de enum a nivel de aplicación (`WeekType` en frontend). No
  requiere tocar filas existentes.
- No afecta a `modulo-survivor` ni `modulo-playoffs`: ninguno de los dos usa
  semanas de pretemporada.
- `modulo-pickem-semanal` todavía no tiene código implementado
  (`weekly_picks` no existe); este change solo deja su spec correcta para
  cuando se implemente, no agrega la tabla ni la UI de predicciones.
