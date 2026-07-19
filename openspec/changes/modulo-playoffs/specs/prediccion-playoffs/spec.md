## ADDED Requirements

### Requirement: Registro de predicción por rango de diferencia de puntos
Un miembro del grupo SHALL poder registrar, para cada partido de una semana de tipo playoffs, una predicción entre tres opciones: el equipo local gana por más de 6 puntos, partido cerrado (diferencia de menos de 6 puntos), o el equipo visitante gana por más de 6 puntos.

#### Scenario: Registrar predicción de local amplio
- **WHEN** un usuario selecciona "local gana por más de 6 puntos" para un partido de playoffs que aún no inició
- **THEN** el sistema guarda la predicción como `local_amplio`

#### Scenario: Registrar predicción de partido cerrado
- **WHEN** un usuario selecciona "partido cerrado" para un partido de playoffs que aún no inició
- **THEN** el sistema guarda la predicción como `cerrado`

#### Scenario: Registrar predicción de visita amplio
- **WHEN** un usuario selecciona "visita gana por más de 6 puntos" para un partido de playoffs que aún no inició
- **THEN** el sistema guarda la predicción como `visita_amplio`

### Requirement: Edición de una predicción antes del inicio del partido
Un usuario SHALL poder modificar su predicción de un partido de playoffs mientras ese partido no haya iniciado.

#### Scenario: Editar predicción a tiempo
- **WHEN** un usuario cambia su predicción para un partido de playoffs cuya hora de inicio (kickoff) todavía no llegó
- **THEN** el sistema actualiza la predicción con el nuevo valor

### Requirement: Bloqueo de predicción tras el inicio del partido
El sistema SHALL rechazar la creación o edición de una predicción de playoffs para un partido cuya hora de inicio (kickoff) ya pasó.

#### Scenario: Intento de predicción tardía
- **WHEN** un usuario intenta registrar o modificar su predicción para un partido de playoffs que ya inició
- **THEN** el sistema rechaza la operación

### Requirement: Predicciones exclusivas de partidos de playoffs
El sistema SHALL permitir predicciones de este módulo únicamente para partidos de semanas de tipo playoffs.

#### Scenario: Intento de predicción fuera de playoffs
- **WHEN** un usuario intenta registrar una predicción de playoffs para un partido de una semana de pretemporada o regular
- **THEN** el sistema rechaza la operación
