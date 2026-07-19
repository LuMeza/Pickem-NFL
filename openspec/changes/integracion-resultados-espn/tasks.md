## 1. Esquema de datos

- [ ] 1.1 Migración: columna `teams.espn_abbreviation` (nullable) + actualizar seed de equipos con la abreviación de ESPN
- [ ] 1.2 Migración: columna `games.espn_event_id` (nullable, indexada)

## 2. Edge Function de sincronización

- [ ] 2.1 Crear `supabase/functions/sync-espn-results` (Deno): fetch al scoreboard de ESPN para la semana vigente
- [ ] 2.2 Mapeo de equipo ESPN → `teams` por `espn_abbreviation`
- [ ] 2.3 Mapeo de partido ESPN → `games`: por `espn_event_id` si ya existe, si no por `week_id` + par de equipos; guardar `espn_event_id` al encontrar coincidencia
- [ ] 2.4 Clasificación de resultado (ganador/empate) y marcador a partir de la respuesta de ESPN
- [ ] 2.5 Escritura condicionada: solo si `result_source IS NULL OR result_source = 'auto_sync'`; marca `result_source = 'auto_sync'`
- [ ] 2.6 Procesamiento partido por partido con manejo de errores aislado (un fallo no detiene la corrida completa)
- [ ] 2.7 Logging de errores de la función (fallas de red, partido sin mapeo, formato inesperado)
- [ ] 2.8 Tests unitarios de las funciones puras de mapeo/clasificación (sin llamadas de red reales)

## 3. Programación y disparo manual

- [ ] 3.1 Configurar cron (Supabase Scheduled Functions o `pg_cron`) para invocar la función cada 15-30 minutos en horario de partidos
- [ ] 3.2 Caso de uso + hook en el frontend para invocar la función bajo demanda desde el panel admin (mismo patrón que `admin-create-user`)
- [ ] 3.3 Botón "Sincronizar ahora" en el panel admin, con estado de carga/resultado de la corrida

## 4. Panel admin — visibilidad del origen del resultado

- [ ] 4.1 Mostrar en la vista de resultados si un partido fue cargado manualmente o por sincronización automática (`result_source`)

## 5. Guardrails

- [ ] 5.1 Confirmar que ningún fallo de la Edge Function bloquea el flujo de carga manual (prueba manual: apagar/romper la función y verificar que el panel admin sigue funcionando)
