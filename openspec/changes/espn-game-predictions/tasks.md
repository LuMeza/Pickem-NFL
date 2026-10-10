## 1. Base de datos

- [x] 1.1 Migración: tabla `game_predictions` (PK `game_id, source`, check `source in ('espn_fpi')`, FK a `games` con `on delete cascade`) con RLS habilitada y sin políticas de escritura para usuarios
- [x] 1.2 Migración: columna `pickem_settings.predictions_mode` (`off` | `after_lock` | `always`, default `off`)
- [x] 1.3 Función `security definer` `can_view_game_prediction(p_game_id)` (admin, o un grupo del usuario con modo `always`, o modo `after_lock` y `now() >= weekly_pick_group_deadline`) y política `select` de `game_predictions` que la usa
- [x] 1.4 Verificar en SQL los escenarios de visibilidad (off, after_lock antes y después del cierre, always, grupo sin fila, admin)

## 2. Edge Function `sync-espn-predictions`

- [x] 2.1 `mapping.ts`: tipos del payload `summary` y `parseEspnPrediction(body)`, que devuelve porcentajes numéricos, `home_spread` normalizado respecto al local (según `homeTeamOdds.favorite`) y `over_under`, o `null` si el predictor no es válido
- [x] 2.2 `mapping.test.ts`: payload real (PHI @ JAX, 73.6/26.2, -7.5), favorito visitante, sin `pickcenter`, sin `predictor`, porcentajes no numéricos
- [x] 2.3 `index.ts`: `authorize` (service role o `platform_admins`), `select` de partidos próximos (sin outcome, kickoff entre now y now+8 días, con `espn_event_id`), fetch de `summary` con concurrencia 4, `upsert` en `game_predictions` con `source = 'espn_fpi'` y resumen `{ gamesConsidered, predictionsUpdated, errors }`
- [x] 2.4 Desplegar y correr manualmente; revisar las filas generadas contra lo que muestra espn.com

## 3. Core (frontend)

- [x] 3.1 Entidad `GamePrediction` y port `PredictionsRepository.listForGames`
- [x] 3.2 Regla `formatPredictionSpread` con tests (local favorito, visitante favorito, 0, null)
- [x] 3.3 Caso de uso `listPredictionsForGames`, y `getPickemPredictionsMode` / `setPickemPredictionsMode` en `PickemStandingsRepository`

## 4. Infraestructura (frontend)

- [x] 4.1 `SupabasePredictionsRepository` (select en `game_predictions` por `game_id in (...)`, mapeo de numeric a number) y registro en `repositories.ts`
- [x] 4.2 Lectura y escritura de `predictions_mode` en el adapter de `pickem_settings` (upsert de la fila del grupo)

## 5. Presentación

- [x] 5.1 Hook `useListPredictionsForGames` y carga de pronósticos en la pantalla de picks (`GamesPage`), pasados a cada `PickRow`
- [x] 5.2 `PickRow`: barra de probabilidad con colores de equipo, porcentajes redondeados, "Favorito por X pts" y texto accesible; sin cambios visuales si no hay pronóstico (siguiendo `doc/design-system.md`, mobile-first)
- [x] 5.3 `AdminPickemSettingsPage`: selector de modo de pronósticos (Ocultos / Después del cierre / Siempre) con texto explicativo
- [x] 5.4 `AdminSyncPage`: botón "Sincronizar pronósticos" que muestra el resumen de la corrida

## 6. Automatización y cierre

- [x] 6.1 Migración con `cron.schedule('sync-espn-predictions', '0 */6 * * *', ...)` (mismo patrón `net.http_post` + `vault`)
- [ ] 6.2 Prueba de punta a punta: con cada modo, un miembro normal y el admin ven (o no ven) la barra según la spec
- [x] 6.3 Correr lint, tests y dependency-cruiser del frontend, y los tests de Deno de la función
