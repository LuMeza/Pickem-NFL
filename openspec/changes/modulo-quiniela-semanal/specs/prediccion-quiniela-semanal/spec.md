## ADDED Requirements

### Requirement: Registro de predicción por partido
Un usuario con acceso aprobado a la quiniela semanal de su grupo SHALL poder registrar, para cada partido de una semana de pretemporada o temporada regular, una predicción de qué equipo gana o si el partido termina en empate.

#### Scenario: Registrar predicción de ganador
- **WHEN** un usuario con acceso aprobado selecciona el equipo local o visitante como ganador de un partido que aún no inició
- **THEN** el sistema guarda la predicción asociada a ese usuario y ese partido

#### Scenario: Registrar predicción de empate
- **WHEN** un usuario con acceso aprobado marca "empate" para un partido que aún no inició
- **THEN** el sistema guarda la predicción como empate

### Requirement: Edición de una predicción antes del inicio del partido
Un usuario SHALL poder modificar una predicción ya registrada mientras el partido correspondiente no haya iniciado.

#### Scenario: Editar predicción a tiempo
- **WHEN** un usuario cambia su predicción para un partido cuya hora de inicio (kickoff) todavía no llegó
- **THEN** el sistema actualiza la predicción con el nuevo valor

### Requirement: Bloqueo de predicción tras el inicio del partido
El sistema SHALL rechazar la creación o edición de una predicción para un partido cuya hora de inicio (kickoff) ya pasó.

#### Scenario: Intento de predicción tardía
- **WHEN** un usuario intenta registrar o modificar su predicción para un partido que ya inició
- **THEN** el sistema rechaza la operación

### Requirement: Restricción por acceso aprobado
El sistema SHALL rechazar el registro de predicciones de un usuario que no tenga acceso aprobado a la quiniela semanal del grupo correspondiente.

#### Scenario: Usuario sin acceso aprobado intenta predecir
- **WHEN** un miembro del grupo sin acceso aprobado a la quiniela semanal intenta registrar una predicción
- **THEN** el sistema rechaza la operación

### Requirement: Predicciones exclusivas de pretemporada y temporada regular
El sistema SHALL permitir predicciones únicamente para partidos de semanas de tipo pretemporada o regular, y SHALL NOT aceptar predicciones para partidos de semanas de tipo playoffs.

#### Scenario: Intento de predicción en semana de playoffs
- **WHEN** un usuario intenta registrar una predicción de quiniela semanal para un partido de una semana de tipo playoffs
- **THEN** el sistema rechaza la operación
