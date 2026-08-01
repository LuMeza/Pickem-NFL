## Why

`base-plataforma` define la carga manual de resultados como la fuente
obligatoria, pero cargar cada partido a mano cada semana es lento y propenso a
error. Existe un endpoint público, gratuito y sin necesidad de API key
(`site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`, no oficial de
ESPN) que expone equipos, marcador y estado de cada partido de NFL. Se propone
usarlo para automatizar la mayoría de la carga de resultados, sin reemplazar
—ni poner en riesgo— la carga manual, que sigue siendo el respaldo y la fuente
de verdad final.

## What Changes

- Sincronización periódica (Edge Function de Supabase + cron) que consulta el
  scoreboard de ESPN y actualiza automáticamente el resultado oficial
  (ganador/empate y marcador) de los partidos correspondientes.
- **Importación automática del calendario** (ampliado post-implementación de
  `base-plataforma`): si un partido reportado por ESPN no existe todavía en
  `games` para esa semana, la sincronización lo crea (equipo local, visitante,
  kickoff), en vez de solo omitirlo. Esto reemplaza la carga manual de
  calendario como flujo principal — la pantalla manual de `base-plataforma`
  (`/admin/games/new`) queda como respaldo si ESPN no tiene un partido o hay
  que corregirlo.
- Botón "Sincronizar ahora" en el panel admin para disparar la sincronización
  (calendario + resultados de las 25 semanas de temporada) bajo demanda, sin
  esperar a la siguiente corrida programada.
- Mapeo de equipos ESPN ↔ equipos internos (`teams.espn_abbreviation`) y de
  partidos ESPN ↔ partidos internos (`games.espn_event_id`, guardado la
  primera vez que se encuentra o se crea una coincidencia por semana + equipos).
- Respeto estricto de la precedencia de la carga manual ya definida en
  `base-plataforma` (`result_source`): la sincronización solo escribe si el
  resultado está vacío o fue puesto por una sincronización previa, nunca si
  fue cargado/corregido a mano.
- Resiliencia: si el endpoint de ESPN falla, cambia de formato o no responde,
  la sincronización de ese partido se omite (se registra el error) sin afectar
  al resto de partidos ni bloquear la carga manual, que sigue disponible
  siempre.
- Advertencia de producto: es un endpoint no documentado/no oficial de ESPN,
  sin SLA ni garantía de estabilidad — riesgo aceptado explícitamente porque
  existe un respaldo manual completo.

## Capabilities

### New Capabilities
- `sincronizacion-resultados-espn`: sincronización automática y bajo demanda
  de resultados desde el scoreboard de ESPN, respetando la precedencia de la
  carga manual y sin depender de esta fuente para operar.

### Modified Capabilities
(ninguna — `carga-resultados`, en `base-plataforma`, ya incorpora el campo
`result_source` y la regla de precedencia que este change usa; no cambia su
comportamiento, solo lo consume)

## Impact

- Requiere que `base-plataforma` esté implementada, incluyendo la columna
  `result_source` en `games`.
- Agrega columnas nuevas a `teams` (`espn_abbreviation`) y `games`
  (`espn_event_id`) — ver `design.md`.
- Introduce la primera pieza de infraestructura fuera de `frontend/`: una
  Supabase Edge Function (`supabase/functions/sync-espn-results`) programada
  por cron, más el botón correspondiente en el panel admin del frontend.
- No afecta a `modulo-pickem-semanal`, `modulo-survivor` ni
  `modulo-playoffs` — todos siguen leyendo resultados oficiales de `games`
  sin importar si el origen fue manual o automático.
