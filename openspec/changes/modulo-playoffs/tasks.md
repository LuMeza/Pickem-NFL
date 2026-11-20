## 1. Esquema de datos

- [x] 1.1 Migración: tabla `playoff_picks` (group_id, user_id, game_id, pick `local_amplio|cerrado|visita_amplio`, timestamps)
- [x] 1.2 Constraint de unicidad: una predicción por usuario+partido
- [x] 1.3 Policy/constraint de bloqueo: no permitir insert/update si `now() >= games.kickoff_at`
- [x] 1.4 Constraint/validación: solo aceptar filas para partidos de semanas de tipo `playoffs`
- [x] 1.5 Policies de RLS: usuario lee/escribe su propia predicción dentro de grupos donde es miembro

## 2. Predicción (`prediccion-playoffs`)

- [x] 2.1 Pantalla de predicción por ronda: listar partidos de playoffs con las 3 opciones (local amplio / cerrado / visita amplio)
- [x] 2.2 Guardar/editar predicción por partido antes del kickoff
- [x] 2.3 Deshabilitar en UI la edición de partidos ya iniciados

## 3. Tabla y ranking (`tabla-playoffs`)

- [x] 3.1 Función/vista SQL de clasificación del resultado oficial (`local_amplio`/`cerrado`/`visita_amplio`) a partir de `home_score`/`away_score`
- [x] 3.2 Vista/consulta SQL de aciertos por usuario y ronda
- [x] 3.3 Vista/consulta SQL de ranking final acumulado de playoffs
- [x] 3.4 Pantalla de tabla de resultados por ronda
- [x] 3.5 Pantalla de ranking final / podio de 3 lugares, incluyendo reporte de empates compartidos

## 4. Guardrails de producto

- [x] 4.1 Revisión de copys: sin menciones a pago, cobro de cuota o premio en efectivo en pantallas de playoffs

## Notas de implementación

- Migraciones `20261119000000`–`20261119000002` **aplicadas** a la base de Supabase (2026-11-19) y registradas en `schema_migrations`. Verificado: tabla con RLS y 3 policies, y `playoff_result_category` con márgenes 7 (amplio), 6 (cerrado), empate y marcador nulo. **Pendiente**: probar RLS con un usuario real (tras kickoff, semana no playoffs, no miembro) y las funciones de tabla con datos.
- La pantalla de picks y las tablas se verificaron solo con `tsc`, `lint`, `lint:arch` y tests unitarios; **no se vieron en navegador** (mismo motivo).
- Rutas: `/playoffs`, `/playoffs/:weekId` (picks), `/playoffs/tabla/:weekId`. La tarjeta "Playoffs" del hub de Pickem ya no está deshabilitada.
- Las tablas incluyen solo a quienes hicieron al menos un pick de playoffs; los partidos sin marcador oficial completo no cuentan como acierto ni fallo.
