## 1. Esquema de datos

- [x] 1.1 Migración: columna `teams.espn_abbreviation` (nullable) + actualizar seed de equipos con la abreviación de ESPN
- [x] 1.2 Migración: columna `games.espn_event_id` (nullable, indexada)

## 2. Edge Function de sincronización

- [x] 2.1 Crear `supabase/functions/sync-espn-results` (Deno): recorre las 25 semanas de `weeks` (pretemporada/regular/playoffs), consulta el scoreboard de ESPN de cada una (`seasontype`/`week`, con `dates`=año de temporada resuelto dinámicamente)
- [x] 2.2 Mapeo de equipo ESPN → `teams` por `espn_abbreviation`
- [x] 2.3 Mapeo de partido ESPN → `games`: por `espn_event_id` si ya existe, si no por `week_id` + par de equipos; si tampoco hay coincidencia, crea el partido y guarda su `espn_event_id`
- [x] 2.4 Clasificación de resultado (ganador/empate) y marcador a partir de la respuesta de ESPN, solo para partidos ya finalizados
- [x] 2.5 Escritura condicionada de resultado: el trigger `games_manual_precedence` (base-plataforma) impone que solo se escriba si `result_source IS NULL OR result_source = 'auto_sync'`; la función siempre marca `result_source = 'auto_sync'`
- [x] 2.6 Procesamiento por lote con manejo de errores aislado por evento/semana (un fallo no detiene la corrida completa)
- [x] 2.7 Logging de errores en el resumen retornado (fallas de red por semana, partido sin mapeo, formato inesperado)
- [x] 2.8 Tests unitarios de las funciones puras de mapeo/clasificación (`mapping.test.ts`, 16 casos, sin llamadas de red reales)

## 3. Programación y disparo manual

- [x] 3.1 Cron Job configurado vía migración SQL (`pg_cron` + `pg_net`, migración `20260802000000_espn_sync_cron.sql`) que invoca la función cada 15 minutos, autenticando con la service role key guardada en Supabase Vault (secreto `service_role_key`, creado una sola vez a mano en el SQL Editor — nunca en el repo)
- [x] 3.2 Caso de uso + hook en el frontend para invocar la función bajo demanda desde el panel admin (mismo patrón que `admin-create-user`)
- [x] 3.3 Botón "Sincronizar con ESPN" en el panel admin (`/admin/sync`), con estado de carga y resumen de la corrida (semanas revisadas, partidos creados, resultados actualizados, errores)

## 4. Panel admin — visibilidad del origen del resultado

- [x] 4.1 Mostrar en `/admin/results` si un partido fue cargado manualmente o por sincronización automática (`result_source`)

## 5. Guardrails

- [x] 5.1 Ningún fallo de la Edge Function bloquea el flujo de carga manual — por construcción: `/admin/games/new` y `/admin/results` son pantallas independientes que no invocan `sync-espn-results` ni dependen de su resultado; la función además captura errores por semana/evento y siempre retorna 200 con un resumen (nunca deja partidos a medio escribir)
