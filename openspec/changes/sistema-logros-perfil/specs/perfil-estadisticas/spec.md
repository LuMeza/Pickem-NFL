## ADDED Requirements

### Requirement: Resumen de aciertos en el perfil
El sistema SHALL mostrar en el perfil del usuario un resumen de sus aciertos
totales y su porcentaje de acierto en Pickem Semanal, agregado a través de
todos los grupos donde tiene acceso aprobado.

#### Scenario: Usuario con picks registrados en más de un grupo
- **WHEN** un usuario con acceso aprobado a Pickem Semanal en más de un grupo visita su perfil
- **THEN** el sistema muestra sus aciertos totales y porcentaje de acierto sumando los partidos de todos esos grupos

#### Scenario: Usuario sin acceso aprobado a Pickem Semanal
- **WHEN** un usuario sin acceso aprobado a Pickem Semanal en ningún grupo visita su perfil
- **THEN** el sistema muestra el resumen en un estado vacío, sin error, indicando que todavía no tiene picks registrados

### Requirement: Visualización de logros propios en el perfil
El sistema SHALL mostrar en el perfil del usuario el catálogo completo de
logros, distinguiendo visualmente los que ya desbloqueó de los que todavía
no.

#### Scenario: Perfil con logros desbloqueados y bloqueados
- **WHEN** un usuario con al menos un logro desbloqueado y al menos uno pendiente visita su perfil
- **THEN** el sistema muestra ambos grupos de logros, marcando claramente cuáles están desbloqueados

#### Scenario: Perfil sin ningún logro desbloqueado todavía
- **WHEN** un usuario que todavía no desbloqueó ningún logro visita su perfil
- **THEN** el sistema muestra el catálogo completo con todos los logros en estado bloqueado, sin tratarlo como un error

### Requirement: Descripción accesible de cada logro
El sistema SHALL permitir consultar la descripción de cada logro (desbloqueado
o no) directamente desde su representación visual en el perfil.

#### Scenario: Consultar el detalle de un logro bloqueado
- **WHEN** un usuario interactúa con un logro que todavía no desbloqueó
- **THEN** el sistema muestra la descripción de qué se necesita para desbloquearlo
