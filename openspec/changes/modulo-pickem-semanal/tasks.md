## 1. Esquema de datos

- [x] 1.1 Migración: tabla `weekly_access` (group_id, user_id, week_id, status `solicitado`/`aprobado`/`rechazado`, timestamps)
- [x] 1.2 Constraint de unicidad: un estado de acceso por usuario+semana
- [x] 1.3 Policy/constraint de bloqueo: no permitir insert (solicitud) ni update (aprobación/rechazo) en `weekly_access` si `now() >= kickoff_at` del primer partido de esa semana
- [x] 1.4 Policies de RLS de `weekly_access`: usuario ve/crea su propia solicitud; solo `platform_admins` aprueba/rechaza y ve todas las solicitudes del grupo
- [x] 1.5 Migración: tabla `weekly_picks` (game_id, user_id, group_id, pick `home|away|tie`, timestamps)
- [x] 1.6 Constraint de unicidad: una predicción por usuario+partido
- [x] 1.7 Policy/constraint de bloqueo: no permitir insert/update si `now() >= games.kickoff_at`
- [x] 1.8 Policies de RLS de `weekly_picks`: usuario lee/escribe solo sus propias predicciones; solo para partidos de semanas donde tiene `weekly_access` en estado `aprobado`
- [x] 1.9 No usar `module_access`/`'pickem_semanal'` para este módulo: no agregar ese valor a ningún check ni pantalla nueva (Survivor y Playoffs siguen usando `module_access` sin cambios)

## 2. Acceso semanal (`acceso-semanal-pickem`)

- [x] 2.1 Pantalla de usuario: ver estado de acceso de la semana en curso (sin solicitud / solicitado / aprobado / rechazado) y botón para solicitar, reutilizando el patrón visual de `RequestModuleAccessPage` pero con grano semanal
- [x] 2.2 Deshabilitar la solicitud en UI una vez iniciado el primer partido de la semana
- [x] 2.3 Panel admin: pantalla de aprobación/rechazo de solicitudes semanales pendientes, agrupadas por semana (reutilizando el patrón de `ModuleAccessRequestsPage`)
- [x] 2.4 Deshabilitar en UI la aprobación/rechazo una vez iniciado el primer partido de la semana correspondiente

## 3. Predicción (`prediccion-pickem-semanal`)

- [x] 3.1 Pantalla semanal de predicción: listar partidos de la semana con opciones local/empate/visita
- [x] 3.2 Guardar/editar predicción por partido antes del kickoff
- [x] 3.3 Deshabilitar en UI la edición de partidos ya iniciados
- [x] 3.4 Validar en el flujo de guardado que el usuario tiene `weekly_access` aprobado para la semana del partido
- [x] 3.5 Excluir semanas de tipo playoffs de la pantalla de predicción

## 4. Tabla de posiciones (`tabla-pickem-semanal`)

- [x] 4.1 Vista/consulta SQL de aciertos por usuario y semana (compara `weekly_picks` contra resultado oficial en `games`)
- [x] 4.2 Vista/consulta SQL de tabla acumulada de temporada (suma solo semanas con `weekly_access` aprobado)
- [x] 4.3 Pantalla de tabla semanal
- [x] 4.4 Pantalla de tabla acumulada de temporada
- [x] 4.5 Control de visibilidad de tablas para usuarios sin ningún acceso semanal aprobado en la temporada, según configuración del administrador de plataforma
- [x] 4.6 Lógica de determinación de ganador(es) de temporada (incluye caso de empate en primer lugar, sin desempate)
- [x] 4.7 Pantalla/indicador de resultado final una vez que playoffs inició

## 5. Guardrails de producto

- [x] 5.1 Revisión de copys: sin menciones a pago, cobro de cuota o premio en efectivo en pantallas de acceso, predicción o tabla
