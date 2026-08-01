## MODIFIED Requirements

### Requirement: Catálogo de semanas de temporada
El sistema SHALL modelar semanas de temporada con un tipo (hof, pretemporada, regular, playoffs) y un número, incluyendo el Hall of Fame Game (tipo `hof`, semana única) y las semanas de pretemporada (Pre Sem. 1, 2, 3).

#### Scenario: Consultar semanas
- **WHEN** un usuario autenticado solicita la lista de semanas de la temporada
- **THEN** el sistema retorna las semanas ordenadas cronológicamente con su tipo y número, incluida la semana de tipo `hof`

#### Scenario: Identificar inicio de playoffs
- **WHEN** cualquier proceso o módulo necesita saber si la ronda de playoffs ya inició
- **THEN** el sistema permite determinarlo consultando si existe una semana de tipo playoffs marcada como vigente/iniciada
