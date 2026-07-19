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
El sistema SHALL registrar los partidos de cada semana, cada uno con equipo local, equipo visitante y la semana a la que pertenece.

#### Scenario: Consultar partidos de una semana
- **WHEN** un usuario autenticado solicita los partidos de una semana específica
- **THEN** el sistema retorna todos los partidos de esa semana con sus equipos local y visitante

### Requirement: Catálogo de solo lectura para usuarios sin rol de administrador
Cualquier usuario autenticado SHALL poder leer equipos, semanas y partidos. El sistema SHALL NOT permitir que un usuario sin permiso de administrador de plataforma los cree, edite o elimine.

#### Scenario: Usuario regular intenta modificar el catálogo
- **WHEN** un usuario autenticado sin permiso de administrador de plataforma intenta crear o editar un equipo, semana o partido
- **THEN** el sistema rechaza la operación
