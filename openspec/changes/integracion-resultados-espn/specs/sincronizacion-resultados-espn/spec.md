## ADDED Requirements

### Requirement: Sincronización automática periódica de resultados
El sistema SHALL sincronizar periódicamente los resultados oficiales de los partidos consultando el scoreboard público de ESPN, durante la temporada.

#### Scenario: Partido finalizado se sincroniza automáticamente
- **WHEN** la sincronización periódica encuentra un partido que ESPN reporta como finalizado y ese partido en el sistema aún no tiene resultado
- **THEN** el sistema registra el resultado oficial (ganador/empate y marcador) obtenido de ESPN

#### Scenario: Partido en curso o no iniciado no se marca con resultado
- **WHEN** la sincronización periódica encuentra un partido que ESPN reporta como no iniciado o en curso
- **THEN** el sistema no registra ningún resultado para ese partido en esa corrida

### Requirement: Importación automática del calendario de partidos
El sistema SHALL crear un partido nuevo (semana, equipo local, equipo visitante, kickoff) cuando la sincronización encuentra un evento en el scoreboard de ESPN que no tiene equivalente todavía en el catálogo interno. La carga manual del calendario (`base-plataforma`, `/admin/games/new`) SHALL seguir disponible como respaldo.

#### Scenario: ESPN reporta un partido que no existe en el catalogo interno
- **WHEN** la sincronización encuentra un evento de ESPN cuya semana y par de equipos no coinciden con ningún partido ya registrado
- **THEN** el sistema crea el partido con los datos de ESPN (semana, equipo local, equipo visitante, kickoff) antes de intentar registrar cualquier resultado

#### Scenario: ESPN reporta un partido que ya existe
- **WHEN** la sincronización encuentra un evento de ESPN que ya coincide con un partido existente (por `espn_event_id` o por semana + equipos)
- **THEN** el sistema no crea un partido duplicado, solo actualiza su resultado si corresponde

### Requirement: Sincronización manual bajo demanda
El administrador de plataforma SHALL poder disparar manualmente una sincronización desde el panel admin, sin esperar a la siguiente corrida programada.

#### Scenario: Administrador sincroniza manualmente
- **WHEN** el administrador de plataforma activa la sincronización manual desde el panel admin
- **THEN** el sistema ejecuta el mismo proceso de sincronización que la corrida programada, de inmediato

### Requirement: Precedencia de la carga manual sobre la sincronización automática
La sincronización SHALL NOT sobrescribir el resultado de un partido cuyo resultado ya fue cargado o corregido manualmente por un administrador, sin importar si la sincronización ocurre automáticamente o bajo demanda.

#### Scenario: Partido con resultado cargado manualmente
- **WHEN** la sincronización procesa un partido cuyo resultado ya fue cargado o corregido manualmente
- **THEN** el sistema omite ese partido y conserva el resultado cargado manualmente sin modificarlo

#### Scenario: Partido sin intervención manual
- **WHEN** la sincronización procesa un partido cuyo resultado está vacío o fue puesto por una sincronización anterior
- **THEN** el sistema actualiza el resultado con los datos obtenidos de ESPN

### Requirement: Resiliencia ante fallas de la fuente externa
El sistema SHALL continuar funcionando con normalidad, incluida la carga manual de resultados, si la sincronización con ESPN falla total o parcialmente. Una falla al sincronizar un partido SHALL NOT impedir que se sincronicen los demás partidos de la misma corrida.

#### Scenario: El endpoint de ESPN no responde
- **WHEN** el endpoint de ESPN no responde o responde con un error durante una corrida de sincronización
- **THEN** el sistema registra el error de esa corrida y el resto de la aplicación, incluida la carga manual de resultados, sigue funcionando sin interrupción

#### Scenario: Un partido falla al sincronizar, los demás no se ven afectados
- **WHEN** un partido específico no puede sincronizarse (por ejemplo, no se encuentra su equivalente interno)
- **THEN** el sistema registra ese caso y continúa procesando el resto de los partidos de la misma corrida
