## ADDED Requirements

### Requirement: Catálogo de equipos NFL
El sistema SHALL mantener un catálogo de los 32 equipos de la NFL, visible para cualquier usuario autenticado.

#### Scenario: Consultar equipos
- **WHEN** un usuario autenticado solicita la lista de equipos
- **THEN** el sistema retorna los 32 equipos con su nombre

### Requirement: Catálogo de semanas de temporada
El sistema SHALL modelar semanas de temporada con un tipo (pretemporada, regular, playoffs) y un número, incluyendo semanas de pretemporada (Pre Sem. 1, 2, 3).

#### Scenario: Consultar semanas
- **WHEN** un usuario autenticado solicita la lista de semanas de la temporada
- **THEN** el sistema retorna las semanas ordenadas cronológicamente con su tipo y número

#### Scenario: Identificar inicio de playoffs
- **WHEN** cualquier proceso o módulo necesita saber si la ronda de playoffs ya inició
- **THEN** el sistema permite determinarlo consultando si existe una semana de tipo playoffs marcada como vigente/iniciada

### Requirement: Catálogo de partidos por semana
El sistema SHALL registrar los partidos de cada semana, cada uno con equipo local, equipo visitante, la semana a la que pertenece y su fecha/hora de inicio (kickoff).

#### Scenario: Consultar partidos de una semana
- **WHEN** un usuario autenticado solicita los partidos de una semana específica
- **THEN** el sistema retorna todos los partidos de esa semana con sus equipos local y visitante, y su fecha/hora de inicio

#### Scenario: Determinar si un partido ya inició
- **WHEN** cualquier módulo de predicciones necesita saber si un partido ya arrancó (para bloquear cambios de predicción)
- **THEN** el sistema permite determinarlo comparando la hora actual contra la fecha/hora de inicio del partido

### Requirement: Registro de partidos por el administrador
Un administrador de plataforma SHALL poder registrar un partido nuevo (semana, equipo local, equipo visitante y kickoff) para construir el calendario de la temporada. Sin esta operación no hay forma de crear partidos, ya que la carga de resultados (`carga-resultados`) solo edita partidos existentes.

#### Scenario: Administrador agrega un partido
- **WHEN** un administrador de plataforma envía semana, equipo local, equipo visitante y fecha/hora de kickoff válidos
- **THEN** el sistema crea el partido en esa semana

#### Scenario: Usuario regular intenta agregar un partido
- **WHEN** un usuario autenticado que no es administrador de plataforma intenta registrar un partido
- **THEN** el sistema rechaza la operación

### Requirement: Catálogo de solo lectura para usuarios sin rol de administrador
Cualquier usuario autenticado SHALL poder leer equipos, semanas y partidos. El sistema SHALL NOT permitir que un usuario sin permiso de administrador de plataforma los cree, edite o elimine.

#### Scenario: Usuario regular intenta modificar el catálogo
- **WHEN** un usuario autenticado sin permiso de administrador de plataforma intenta crear o editar un equipo, semana o partido
- **THEN** el sistema rechaza la operación
