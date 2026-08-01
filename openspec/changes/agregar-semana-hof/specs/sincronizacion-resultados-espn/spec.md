## MODIFIED Requirements

### Requirement: Sincronización automática periódica de resultados
El sistema SHALL sincronizar periódicamente los resultados oficiales de los partidos consultando el scoreboard público de ESPN, durante la temporada, incluido el Hall of Fame Game (semana de tipo `hof`).

#### Scenario: Partido finalizado se sincroniza automáticamente
- **WHEN** la sincronización periódica encuentra un partido que ESPN reporta como finalizado y ese partido en el sistema aún no tiene resultado
- **THEN** el sistema registra el resultado oficial (ganador/empate y marcador) obtenido de ESPN

#### Scenario: Partido en curso o no iniciado no se marca con resultado
- **WHEN** la sincronización periódica encuentra un partido que ESPN reporta como no iniciado o en curso
- **THEN** el sistema no registra ningún resultado para ese partido en esa corrida

#### Scenario: Hall of Fame Game se sincroniza como cualquier otro partido
- **WHEN** la sincronización procesa la semana de tipo `hof`
- **THEN** el sistema consulta el Hall of Fame Game en ESPN (`seasontype=1, week=1`) igual que cualquier otra semana, en vez de omitirlo
