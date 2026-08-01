## 1. Esquema de datos

- [x] 1.1 Migración: tabla `survivor_picks` (group_id, user_id, week_id, team_id, life_number, timestamps)
- [x] 1.2 Constraint de unicidad `(user_id, group_id, team_id)` — no repetir equipo en la temporada
- [x] 1.3 Constraint de unicidad `(user_id, group_id, week_id)` — una elección por semana
- [x] 1.4 Policy/constraint de bloqueo: no permitir insert/update si `now() >= games.kickoff_at` del partido del equipo elegido
- [x] 1.5 Migración: tabla `survivor_state` (group_id, user_id, current_life, status, first_loss_week_id, eliminated_week_id, final_rank)
- [x] 1.6 Policies de RLS: usuario lee/escribe su propia elección; estado de survivor visible para miembros del grupo

## 2. Predicción (`prediccion-survivor`)

- [x] 2.1 Pantalla semanal: elegir equipo entre los disponibles, excluyendo equipos ya usados por el usuario
- [x] 2.2 Guardar/editar elección antes del kickoff del partido correspondiente
- [x] 2.3 Deshabilitar en UI la elección de equipos cuyo partido ya inició
- [x] 2.4 Bloquear el flujo de elección para usuarios con estado "eliminado"
- [x] 2.5 Pantalla de historial de equipos usados por el usuario

## 3. Estado y ranking (`estado-survivor`)

- [x] 3.1 Función/Edge Function de procesamiento de resultados semanales: consumir vida, avanzar o eliminar según corresponda (función SQL, disparada automáticamente por trigger al cargarse un resultado — manual o vía ESPN — más botón admin como plan B; verificado con datos reales en transacción de prueba, ver commit)
- [x] 3.2 Manejar el caso de usuario vivo sin elección registrada (equivale a derrota)
- [x] 3.3 Hacer el procesamiento idempotente/reejecutable ante corrección de un resultado ya cargado
- [x] 3.4 Pantalla de estado actual (vivo con vida vigente / eliminado y en qué semana) por participante — ver nota de alcance en design.md: no reconstruye el estado histórico de cada semana pasada individualmente, solo el estado vigente
- [x] 3.5 Cálculo de ranking final con podio de 3 lugares
- [x] 3.6 Lógica de desempate por semana de primera derrota (duración con vida original)
- [x] 3.7 Pantalla de podio/ranking de supervivencia del grupo

## 4. Guardrails de producto

- [x] 4.1 Revisión de copys: sin menciones a pago, cobro de cuota o premio en efectivo en pantallas de survivor
