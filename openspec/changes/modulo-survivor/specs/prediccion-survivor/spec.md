## ADDED Requirements

### Requirement: Elección semanal de equipo
Un usuario vivo en el survivor de su grupo SHALL poder elegir, para cada semana con partidos disponibles, un equipo que cree que va a ganar.

#### Scenario: Elegir equipo de la semana
- **WHEN** un usuario vivo en el survivor selecciona un equipo participante de un partido de la semana actual que aún no inició
- **THEN** el sistema guarda la elección asociada a ese usuario y esa semana

### Requirement: Una sola elección por semana
El sistema SHALL permitir a lo sumo una elección de equipo por usuario y por semana.

#### Scenario: Cambiar de equipo antes del cierre
- **WHEN** un usuario que ya eligió un equipo para la semana selecciona un equipo distinto antes de que el partido correspondiente inicie
- **THEN** el sistema reemplaza la elección anterior por la nueva

### Requirement: Restricción de no repetición de equipo en la temporada
El sistema SHALL rechazar la elección de un equipo que el mismo usuario ya haya elegido en cualquier semana previa de la misma temporada, dentro del mismo grupo.

#### Scenario: Intento de repetir equipo
- **WHEN** un usuario intenta elegir un equipo que ya usó en una semana anterior de la temporada
- **THEN** el sistema rechaza la elección

### Requirement: Bloqueo de elección tras el inicio del partido
El sistema SHALL rechazar la creación o edición de la elección de un usuario para un equipo cuyo partido ya inició.

#### Scenario: Intento de elección tardía
- **WHEN** un usuario intenta elegir o cambiar su equipo para un partido que ya inició
- **THEN** el sistema rechaza la operación

### Requirement: Restricción a usuarios vivos
El sistema SHALL rechazar el registro de una elección de un usuario cuyo estado en el survivor ya sea "eliminado".

#### Scenario: Usuario eliminado intenta elegir equipo
- **WHEN** un usuario con estado "eliminado" en el survivor intenta registrar una elección de equipo para una semana futura
- **THEN** el sistema rechaza la operación

### Requirement: Historial de equipos utilizados
El sistema SHALL permitir consultar, para cualquier usuario participante, la lista de equipos que ya utilizó a lo largo de la temporada.

#### Scenario: Consultar historial propio
- **WHEN** un usuario consulta su historial de equipos usados en el survivor
- **THEN** el sistema retorna todos los equipos que eligió en semanas anteriores de esa temporada
