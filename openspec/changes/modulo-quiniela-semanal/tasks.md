## 1. Esquema de datos

- [ ] 1.1 Migración: tabla `weekly_picks` (game_id, user_id, group_id, pick `home|away|tie`, timestamps)
- [ ] 1.2 Constraint de unicidad: una predicción por usuario+partido
- [ ] 1.3 Policy/constraint de bloqueo: no permitir insert/update si `now() >= games.kickoff_at`
- [ ] 1.4 Policies de RLS: usuario lee/escribe solo sus propias predicciones; solo dentro de grupos donde tiene acceso aprobado a la quiniela semanal

## 2. Predicción (`prediccion-quiniela-semanal`)

- [ ] 2.1 Pantalla semanal de predicción: listar partidos de la semana con opciones local/empate/visita
- [ ] 2.2 Guardar/editar predicción por partido antes del kickoff
- [ ] 2.3 Deshabilitar en UI la edición de partidos ya iniciados
- [ ] 2.4 Validar en el flujo de guardado que el usuario tiene acceso aprobado al módulo en ese grupo
- [ ] 2.5 Excluir semanas de tipo playoffs de la pantalla de predicción

## 3. Tabla de posiciones (`tabla-quiniela-semanal`)

- [ ] 3.1 Vista/consulta SQL de aciertos por usuario y semana (compara `weekly_picks` contra resultado oficial en `games`)
- [ ] 3.2 Vista/consulta SQL de tabla acumulada de temporada
- [ ] 3.3 Pantalla de tabla semanal
- [ ] 3.4 Pantalla de tabla acumulada de temporada
- [ ] 3.5 Control de visibilidad de tablas para usuarios sin acceso aprobado, según configuración del admin del grupo
- [ ] 3.6 Lógica de determinación de ganador(es) de temporada (incluye caso de empate en primer lugar, sin desempate)
- [ ] 3.7 Pantalla/indicador de resultado final una vez que playoffs inició

## 4. Guardrails de producto

- [ ] 4.1 Revisión de copys: sin menciones a pago, cobro de cuota o premio en efectivo en pantallas de predicción o tabla
