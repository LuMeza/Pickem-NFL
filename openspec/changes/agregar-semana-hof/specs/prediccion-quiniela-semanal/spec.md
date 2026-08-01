## MODIFIED Requirements

### Requirement: Registro de predicción por partido
Un usuario con acceso aprobado a la quiniela semanal de su grupo SHALL poder registrar, para cada partido de una semana de tipo hof, pretemporada o temporada regular, una predicción de qué equipo gana o si el partido termina en empate.

#### Scenario: Registrar predicción de ganador
- **WHEN** un usuario con acceso aprobado selecciona el equipo local o visitante como ganador de un partido que aún no inició
- **THEN** el sistema guarda la predicción asociada a ese usuario y ese partido

#### Scenario: Registrar predicción de empate
- **WHEN** un usuario con acceso aprobado marca "empate" para un partido que aún no inició
- **THEN** el sistema guarda la predicción como empate

#### Scenario: Registrar predicción del Hall of Fame Game
- **WHEN** un usuario con acceso aprobado registra una predicción para el partido de la semana de tipo `hof`
- **THEN** el sistema la guarda igual que una predicción de cualquier semana de pretemporada o temporada regular

### Requirement: Predicciones exclusivas de hof, pretemporada y temporada regular
El sistema SHALL permitir predicciones únicamente para partidos de semanas de tipo hof, pretemporada o regular, y SHALL NOT aceptar predicciones para partidos de semanas de tipo playoffs.

#### Scenario: Intento de predicción en semana de playoffs
- **WHEN** un usuario intenta registrar una predicción de quiniela semanal para un partido de una semana de tipo playoffs
- **THEN** el sistema rechaza la operación
