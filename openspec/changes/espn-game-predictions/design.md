## Context

Ya sincronizamos desde el sitio público (no oficial) de ESPN:
- calendario y resultados (`sync-espn-results`, scoreboard por semana, cron cada 15 min en días de partido);
- rosters y reporte de lesiones (`sync-espn-roster`).

Ambas funciones usan `site.web.api.espn.com`, porque `site.api.espn.com` quedó bloqueado por Akamai.

El endpoint `GET .../apis/site/v2/sports/football/nfl/summary?event={espn_event_id}` devuelve por partido, entre otros:

```json
"predictor": { "homeTeam": { "id": "30", "gameProjection": "73.6" },
               "awayTeam": { "id": "21", "gameProjection": "26.2" } },
"pickcenter": [{ "provider": {...}, "details": "JAX -7.5", "spread": -7.5, "overUnder": 41.5,
                 "homeTeamOdds": { "favorite": true, "moneyLine": -395, ... },
                 "awayTeamOdds": { "favorite": false, ... } }]
```

Lo verificamos en vivo el 2026-10-09 con el evento 401872981 (PHI @ JAX). Los porcentajes vienen como string y no suman 100: el resto (~0.2) es la probabilidad de empate.

La visibilidad del Pick'em por grupo ya vive en `pickem_settings` (una fila por grupo, editada en `AdminPickemSettingsPage`). El cierre de picks por partido lo calcula `weekly_pick_group_deadline(week_id, kickoff_at)`.

## Goals / Non-Goals

**Goals:**
- Pronóstico de victoria por partido de la semana, visible en la hoja de picks.
- Que el admin controle si el pronóstico se ve y cuándo, para que no se convierta en "copiar al modelo".
- Que el esquema permita agregar un modelo propio (Elo) en la fase 2 sin migrar datos.

**Non-Goals:**
- Modelo propio (Elo, ajustes por QB y lesiones): queda para la fase 2.
- Pronósticos en Survivor y Playoffs: los datos quedan disponibles, pero la UI no se toca en este cambio.
- Logro "Le ganaste al modelo" o estadísticas de "modelo vs. tú".
- Mostrar momios, casas de apuestas o cualquier cosa relacionada con apostar.

## Decisions

### 1. Edge Function separada (`sync-espn-predictions`) en vez de extender `sync-espn-results`
`sync-espn-results` ya recorre todas las semanas y antes tuvo problemas de tiempo de ejecución. El pronóstico requiere una llamada a `summary` **por partido** (unas 16 por semana), así que mezclarlo con los resultados agregaría latencia a algo crítico, que corre cada 15 minutos. Además, el pronóstico cambia lento (lesiones, líneas): basta con correrlo cada 6 horas.
- *Alternativa descartada*: un paso extra dentro de `sync-espn-results`. Tiene menos piezas, pero un fallo o lentitud de `summary` afectaría la sincronización de resultados.
- Se reutilizan `authorize` (service role o `platform_admins`), `corsHeaders` y la estructura `mapping.ts` + `mapping.test.ts`.

### 2. Qué partidos se consultan
Partidos con `espn_event_id` no nulo, sin `outcome`, con `kickoff_at > now()` y `kickoff_at <= now() + 8 días`. Es un solo `select` y luego un `fetch` por partido, con concurrencia limitada (4 a la vez).
- La condición `kickoff_at > now()` implementa el **congelamiento**: después del kickoff, el partido ya no entra en la consulta y su fila queda como estaba.

### 3. Tabla `game_predictions` con `source`
```
game_predictions(
  game_id uuid references games on delete cascade,
  source text check (source in ('espn_fpi')),   -- fase 2: 'elo'
  home_win_pct numeric(5,2) not null,
  away_win_pct numeric(5,2) not null,
  home_spread numeric(4,1) null,               -- negativo = local favorito
  over_under numeric(4,1) null,
  fetched_at timestamptz not null default now(),
  primary key (game_id, source)
)
```
- La escritura es un `upsert` con `onConflict: 'game_id,source'`.
- *Alternativa descartada*: columnas nuevas en `games`. Es más simple de leer, pero obliga a otra migración (y a nombres ambiguos) cuando llegue el Elo, y además mezcla el pronóstico con la RLS de `games`, que hoy es lectura pública para autenticados.
- `home_spread` se normaliza respecto al local. Si `homeTeamOdds.favorite` es true, se guarda `-abs(spread)`; si el favorito es el visitante, `+abs(spread)`. Así no dependemos de la convención de signo de ESPN. Se toma el primer elemento de `pickcenter` (prioridad 1). El nombre del proveedor y los moneylines **no** se guardan.

### 4. Visibilidad en RLS con `pickem_settings.predictions_mode`
`alter table pickem_settings add column predictions_mode text not null default 'off' check (predictions_mode in ('off','after_lock','always'))`.

La política `select` de `game_predictions` permite leer la fila si:
- el usuario es `platform_admin`, **o**
- existe un grupo del que es miembro con `predictions_mode = 'always'`, **o**
- existe un grupo con `predictions_mode = 'after_lock'` y `now() >= weekly_pick_group_deadline(g.week_id, g.kickoff_at)` para el partido.

Esto se encapsula en una función `security definer` `can_view_game_prediction(p_game_id uuid)`, igual que `can_view_pickem_tables`.
- Si un grupo no tiene fila en `pickem_settings`, se trata como `off`, porque la política solo ve grupos con fila.
- La escritura solo la hace la service role (Edge Function); no hay política de insert/update para usuarios.
- *Alternativa descartada*: ocultarlo solo en la UI. El pick se lee desde el cliente, así que con `after_lock` cualquiera podría consultar la tabla directamente; RLS es la última línea de defensa (`arquitectura-frontend`).
- Hoy existe un solo grupo global; si en el futuro un usuario está en varios grupos con modos distintos, gana el más permisivo. Es aceptable, porque el pronóstico no es secreto entre grupos, solo es una decisión de juego.

### 5. Frontend (3 capas)
- `core/entities/gamePrediction.ts`: `GamePrediction { gameId, source, homeWinPct, awayWinPct, homeSpread, overUnder, fetchedAt }`.
- `core/ports/PredictionsRepository.ts`: `listForGames(gameIds: string[]): Promise<Map<string, GamePrediction>>`, que devuelve solo `espn_fpi` por ahora.
- `core/rules/formatPredictionSpread.ts` (con test): de `homeSpread` a `{ favorite: 'home' | 'away', points: 7.5 } | null`; `0` o `null` dan `null` ("pick'em").
- `core/use-cases/listPredictionsForGames.ts` + hook `useListPredictionsForGames`.
- `getPickemPredictionsMode` / `setPickemPredictionsMode` en `PickemStandingsRepository`, junto al flag de tablas que ya existe.
- `PickRow` recibe una `prediction?: GamePrediction` opcional y dibuja una barra delgada bajo los equipos, con el color de cada equipo (`--team-primary`), los porcentajes redondeados y la etiqueta "Pronóstico ESPN". La línea va en un renglón aparte, "Línea de apuestas: SEA por 3 pts", porque es otra fuente (las casas de apuestas, vía `pickcenter`) y puede no coincidir con el favorito del modelo. La barra es `aria-hidden` y va acompañada de un texto accesible: "Pronóstico ESPN: Jaguars 74%, Eagles 26%".

### 6. Cron
Un job de `pg_cron` cada 6 horas (`0 */6 * * *`), con el mismo patrón `net.http_post` y la service role desde `vault`. No hace falta saltarse días: si no hay partidos próximos, la corrida no hace ninguna llamada a ESPN.

## Risks / Trade-offs

- [ESPN cambia el payload o bloquea `summary`] → `mapping.ts` valida el shape y descarta lo que no cuadra, con errores en el resumen. La quiniela funciona igual sin pronóstico, y la fase 2 (Elo propio) sirve de respaldo.
- [Pronóstico desactualizado por una lesión de último minuto] → Corre cada 6 horas, más el botón manual. El dato de `fetched_at` permite mostrar "actualizado hace X h" si se necesita.
- [Que todos copien al favorito] → El modo por defecto es `off`, y `after_lock` permite usarlo solo como dato de contexto después del cierre.
- [Asociación con apuestas] → El spread se guarda sin proveedor y se muestra como "Favorito por X pts"; no se guardan ni muestran momios, logos ni links.
- [Costo de RLS por fila con `weekly_pick_group_deadline`] → Son unas 16 filas por semana, así que es despreciable.

## Migration Plan

1. Aplicar la migración (tabla, RLS, función `can_view_game_prediction`, columna `predictions_mode` con default `off`). No hay cambios visibles para nadie.
2. Desplegar `sync-espn-predictions` y correrla una vez desde `/admin/sync` para verificar el resumen.
3. Desplegar el frontend. Con el modo `off` no cambia nada, hasta que el admin elija un modo.
4. Crear el cron.

**Rollback**: poner `predictions_mode = 'off'` oculta todo de inmediato. Para revertir por completo: `cron.unschedule`, borrar la función y hacer `drop table game_predictions`. No hay datos de usuarios involucrados.

## Open Questions

- ¿Default `off` o `after_lock`? Se propone `off` para no cambiar la dinámica de la quiniela sin que el admin lo decida.
- ¿Mostrar también el over/under? Se guarda, pero la UI propuesta no lo muestra, porque no aporta a elegir ganador.
- Fase 2 (Elo): ¿se muestra junto a ESPN ("ESPN 74% · Modelo propio 68%") o como respaldo cuando ESPN no tenga dato?
