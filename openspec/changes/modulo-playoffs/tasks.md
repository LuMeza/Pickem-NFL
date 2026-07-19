## 1. Esquema de datos

- [ ] 1.1 Migración: tabla `playoff_picks` (group_id, user_id, game_id, pick `local_amplio|cerrado|visita_amplio`, timestamps)
- [ ] 1.2 Constraint de unicidad: una predicción por usuario+partido
- [ ] 1.3 Policy/constraint de bloqueo: no permitir insert/update si `now() >= games.kickoff_at`
- [ ] 1.4 Constraint/validación: solo aceptar filas para partidos de semanas de tipo `playoffs`
- [ ] 1.5 Policies de RLS: usuario lee/escribe su propia predicción dentro de grupos donde es miembro

## 2. Predicción (`prediccion-playoffs`)

- [ ] 2.1 Pantalla de predicción por ronda: listar partidos de playoffs con las 3 opciones (local amplio / cerrado / visita amplio)
- [ ] 2.2 Guardar/editar predicción por partido antes del kickoff
- [ ] 2.3 Deshabilitar en UI la edición de partidos ya iniciados

## 3. Tabla y ranking (`tabla-playoffs`)

- [ ] 3.1 Función/vista SQL de clasificación del resultado oficial (`local_amplio`/`cerrado`/`visita_amplio`) a partir de `home_score`/`away_score`
- [ ] 3.2 Vista/consulta SQL de aciertos por usuario y ronda
- [ ] 3.3 Vista/consulta SQL de ranking final acumulado de playoffs
- [ ] 3.4 Pantalla de tabla de resultados por ronda
- [ ] 3.5 Pantalla de ranking final / podio de 3 lugares, incluyendo reporte de empates compartidos

## 4. Guardrails de producto

- [ ] 4.1 Revisión de copys: sin menciones a pago, cobro de cuota o premio en efectivo en pantallas de playoffs
