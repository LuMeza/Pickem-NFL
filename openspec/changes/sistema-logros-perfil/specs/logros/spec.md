## ADDED Requirements

### Requirement: Catálogo de logros del sistema
El sistema SHALL exponer un catálogo fijo de logros (id, ámbito, título y
descripción), consultable por cualquier usuario autenticado.

#### Scenario: Consultar catálogo
- **WHEN** un usuario autenticado consulta el catálogo de logros
- **THEN** el sistema devuelve la lista completa de logros definidos, incluyendo los que ese usuario todavía no desbloqueó

### Requirement: Desbloqueo automático de logros de Pickem Semanal
El sistema SHALL desbloquear automáticamente los logros de Pickem Semanal
(primer pick, semana perfecta, racha de 5 aciertos consecutivos, liderazgo
semanal) para un usuario cuando se cumpla su condición, evaluando la
condición únicamente sobre partidos que ya tienen resultado oficial cargado.

#### Scenario: Primer pick de la temporada
- **WHEN** un usuario registra su primer pick histórico en Pickem Semanal
- **THEN** el sistema le desbloquea el logro correspondiente

#### Scenario: Semana perfecta
- **WHEN** todos los partidos de una semana con al menos 3 partidos ya tienen resultado oficial y un usuario acertó el 100% de sus picks de esa semana
- **THEN** el sistema le desbloquea el logro de semana perfecta

#### Scenario: Racha de 5 aciertos consecutivos
- **WHEN** un usuario acierta 5 picks consecutivos ordenados por el horario de inicio de sus partidos, considerando solo partidos con resultado ya definido
- **THEN** el sistema le desbloquea el logro de racha

#### Scenario: Liderazgo semanal
- **WHEN** todos los partidos de una semana ya tienen resultado oficial y un usuario termina en el primer puesto (o empatado en el primer puesto) de la tabla de posiciones de esa semana en su grupo
- **THEN** el sistema le desbloquea el logro de liderazgo semanal para ese grupo

### Requirement: Desbloqueo automático de logros de Survivor
El sistema SHALL desbloquear automáticamente los logros de Survivor
(sobrevivir la temporada regular, podio, vida intacta) cuando el estado de
Survivor del usuario cumpla la condición correspondiente.

#### Scenario: Sobrevivir la temporada regular
- **WHEN** ya no quedan más semanas regulares de Survivor por procesar y el estado del usuario sigue siendo "vivo"
- **THEN** el sistema le desbloquea el logro de sobrevivir la temporada regular

#### Scenario: Podio de Survivor
- **WHEN** al usuario se le asigna una posición de podio (1°, 2° o 3°) en el ranking de supervivencia de su grupo
- **THEN** el sistema le desbloquea el logro de podio para ese grupo

#### Scenario: Vida intacta
- **WHEN** un usuario llega a estar eliminado o al cierre de la temporada regular sin haber usado ninguna vida extra
- **THEN** el sistema le desbloquea el logro de vida intacta

### Requirement: Desbloqueo automático de logros generales
El sistema SHALL desbloquear automáticamente los logros generales
(veteranía, participación en ambos módulos de juego) cuando corresponda,
sin depender de un trigger de resultado de partido.

#### Scenario: Veteranía
- **WHEN** se consulta el perfil de un usuario cuya cuenta tiene más de un año de antigüedad y todavía no tiene el logro de veteranía
- **THEN** el sistema le desbloquea el logro de veteranía en ese momento

#### Scenario: Participación en ambos módulos
- **WHEN** un usuario tiene acceso aprobado a Pickem Semanal y al menos un pick registrado en Survivor dentro del mismo grupo
- **THEN** el sistema le desbloquea el logro de participación en ambos módulos para ese grupo

### Requirement: Persistencia idempotente del desbloqueo
El sistema SHALL registrar cada desbloqueo una única vez por usuario (y por
grupo, cuando el logro sea por grupo) y SHALL NOT revocar un logro ya
desbloqueado aunque la condición que lo originó deje de cumplirse
posteriormente.

#### Scenario: Reevaluación no duplica un logro ya obtenido
- **WHEN** el sistema reevalúa las condiciones de logros para un usuario que ya tiene un logro desbloqueado y la condición vuelve a cumplirse
- **THEN** el sistema no crea un registro duplicado ni altera la fecha de desbloqueo original

#### Scenario: Un logro obtenido no se revoca
- **WHEN** la condición que originó un logro deja de cumplirse en una reevaluación posterior (por ejemplo, otro usuario pasa a liderar esa semana tras una corrección de resultado)
- **THEN** el sistema mantiene el logro ya desbloqueado sin quitarlo

### Requirement: Visibilidad restringida a los logros propios
El sistema SHALL permitir a cada usuario consultar únicamente sus propios
logros desbloqueados, salvo el administrador de plataforma que puede
consultar los de cualquier usuario.

#### Scenario: Usuario consulta sus propios logros
- **WHEN** un usuario autenticado consulta sus logros desbloqueados
- **THEN** el sistema devuelve únicamente los logros de ese usuario

#### Scenario: Usuario intenta consultar logros de otro
- **WHEN** un usuario autenticado (no administrador) intenta consultar los logros desbloqueados de otro usuario
- **THEN** el sistema no devuelve esos datos
