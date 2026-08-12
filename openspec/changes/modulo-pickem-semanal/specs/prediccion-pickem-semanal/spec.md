## ADDED Requirements

### Requirement: Registro de predicción por partido
Un usuario del grupo SHALL poder registrar, para cada partido de esa semana de tipo hof, pretemporada o temporada regular, una predicción de qué equipo gana o si el partido termina en empate.

#### Scenario: Registrar predicción de ganador
- **WHEN** un usuario selecciona el equipo local o visitante como ganador de un partido cuyo bloque de días todavía no cerró (ver "Bloqueo de predicción por bloque de días de la semana")
- **THEN** el sistema guarda la predicción asociada a ese usuario y ese partido

#### Scenario: Registrar predicción de empate
- **WHEN** un usuario marca "empate" para un partido cuyo bloque de días todavía no cerró
- **THEN** el sistema guarda la predicción como empate

### Requirement: Edición de una predicción antes del cierre de su bloque de días
Un usuario SHALL poder modificar una predicción ya registrada mientras el bloque de días del partido correspondiente no haya cerrado.

#### Scenario: Editar predicción a tiempo
- **WHEN** un usuario cambia su predicción para un partido cuyo bloque de días todavía no cerró
- **THEN** el sistema actualiza la predicción con el nuevo valor

### Requirement: Bloqueo de predicción por bloque de días de la semana
El sistema SHALL agrupar los partidos de cada semana en dos bloques según el día de la semana de su kickoff, calculado en huso horario `America/New_York` (huso de la NFL, no UTC ni el huso del usuario): bloque "entre semana" (cualquier día que no sea sábado, domingo o lunes — típicamente miércoles, jueves o viernes) y bloque "fin de semana" (sábado, domingo o lunes). El sistema SHALL rechazar la creación o edición de una predicción para un partido cuyo bloque ya cerró, es decir, cuyo bloque contiene un partido con kickoff igual o anterior al momento actual.

#### Scenario: Intento de predicción tardía en el bloque entre semana
- **WHEN** un usuario intenta registrar o modificar su predicción para un partido de miércoles, jueves o viernes, y ya inició el primer partido de ese bloque esa semana
- **THEN** el sistema rechaza la operación, aunque ese partido puntual todavía no haya iniciado

#### Scenario: Intento de predicción tardía en el bloque de fin de semana
- **WHEN** un usuario intenta registrar o modificar su predicción para un partido de sábado, domingo o lunes, y ya inició el primer partido de ese bloque esa semana
- **THEN** el sistema rechaza la operación, aunque ese partido puntual todavía no haya iniciado

#### Scenario: El cierre de un bloque no afecta al otro
- **WHEN** ya inició el primer partido del bloque "entre semana" de una semana, pero el bloque "fin de semana" de esa misma semana todavía no arrancó
- **THEN** el sistema sigue aceptando predicciones nuevas o editadas para los partidos del bloque "fin de semana"

#### Scenario: Partido que cruza medianoche UTC
- **WHEN** un partido de lunes por la noche en horario de EE. UU. tiene un kickoff que, convertido a UTC, ya cae en la madrugada del martes
- **THEN** el sistema igual lo clasifica en el bloque "fin de semana" (lunes en `America/New_York`), no en un bloque aparte de martes

### Requirement: Predicciones exclusivas de hof, pretemporada y temporada regular
El sistema SHALL permitir predicciones únicamente para partidos de semanas de tipo hof, pretemporada o regular, y SHALL NOT aceptar predicciones para partidos de semanas de tipo playoffs.

#### Scenario: Intento de predicción en semana de playoffs
- **WHEN** un usuario intenta registrar una predicción de pickem semanal para un partido de una semana de tipo playoffs
- **THEN** el sistema rechaza la operación

## REMOVED Requirements

### Requirement: Restricción por acceso semanal aprobado
**Eliminado** el 2026-08-12 junto con toda la capability `acceso-semanal-pickem`
(`supabase/migrations/20260812000000_remove_weekly_access_approval.sql`):
cualquier miembro del grupo puede registrar predicciones sin necesitar acceso
semanal aprobado.
