## ADDED Requirements

### Requirement: Creación de grupo privado
Un usuario autenticado SHALL poder crear un grupo privado, convirtiéndose automáticamente en su owner (admin).

#### Scenario: Creación exitosa
- **WHEN** un usuario autenticado envía un nombre de grupo válido
- **THEN** el sistema crea el grupo, agrega al usuario como miembro con rol owner, y genera un código de invitación inicial

### Requirement: Invitación por link o código
El owner de un grupo SHALL poder obtener un código/link de invitación para compartir, y regenerarlo cuando lo necesite.

#### Scenario: Obtener código de invitación
- **WHEN** el owner abre la sección de invitación de su grupo
- **THEN** el sistema muestra el código/link vigente para compartir

#### Scenario: Regenerar código
- **WHEN** el owner solicita regenerar el código de invitación
- **THEN** el sistema invalida el código anterior y genera uno nuevo, de forma que links previos ya no permiten unirse

### Requirement: Unirse a un grupo mediante invitación
Un usuario autenticado SHALL poder unirse a un grupo existente usando un código o link de invitación válido.

#### Scenario: Unión exitosa
- **WHEN** un usuario autenticado abre un link de invitación válido o ingresa un código válido
- **THEN** el sistema lo agrega como miembro del grupo con rol member

#### Scenario: Código inválido o revocado
- **WHEN** un usuario intenta unirse con un código que no existe o fue regenerado
- **THEN** el sistema rechaza la unión y muestra un mensaje de error

#### Scenario: Usuario ya es miembro
- **WHEN** un usuario que ya pertenece al grupo intenta unirse de nuevo con el mismo código
- **THEN** el sistema no crea una membresía duplicada

### Requirement: Administración de miembros por el owner
El owner del grupo SHALL poder ver la lista de miembros y remover a un miembro del grupo.

#### Scenario: Ver miembros
- **WHEN** el owner abre la pantalla de miembros de su grupo
- **THEN** el sistema muestra la lista de todos los miembros actuales

#### Scenario: Remover miembro
- **WHEN** el owner remueve a un miembro del grupo
- **THEN** el sistema elimina su membresía y ese usuario deja de ver los datos del grupo

#### Scenario: Miembro sin permisos de administración
- **WHEN** un usuario con rol member intenta remover a otro miembro
- **THEN** el sistema rechaza la acción por falta de permisos

### Requirement: Solicitud y aprobación de acceso a un módulo opcional
El sistema SHALL permitir registrar, por cada combinación de grupo, usuario y módulo, un estado de acceso (solicitado, aprobado, rechazado), gestionable por el owner del grupo. Esta es la base genérica que usarán los módulos de juego que requieran aprobación explícita (p. ej. Quiniela Semanal); las reglas específicas de cada módulo se definen en su propio spec.

#### Scenario: Usuario solicita acceso a un módulo
- **WHEN** un miembro del grupo solicita acceso a un módulo que requiere aprobación
- **THEN** el sistema registra el estado como "solicitado" para ese usuario, grupo y módulo

#### Scenario: Owner aprueba una solicitud
- **WHEN** el owner del grupo aprueba una solicitud de acceso pendiente
- **THEN** el sistema cambia el estado a "aprobado" para ese usuario, grupo y módulo

#### Scenario: Owner rechaza una solicitud
- **WHEN** el owner del grupo rechaza una solicitud de acceso pendiente
- **THEN** el sistema cambia el estado a "rechazado" para ese usuario, grupo y módulo

#### Scenario: Usuario sin acceso aprobado no puede participar
- **WHEN** un usuario sin estado "aprobado" para un módulo intenta registrar datos propios de ese módulo (p. ej. una predicción)
- **THEN** el sistema rechaza la operación

### Requirement: Aislamiento de datos entre grupos
El sistema SHALL asegurar que los datos de un grupo (miembros, accesos a módulos, invitaciones) solo sean visibles para los usuarios que pertenecen a ese grupo.

#### Scenario: Usuario ajeno intenta ver datos de otro grupo
- **WHEN** un usuario autenticado que no pertenece a un grupo intenta consultar los datos de ese grupo directamente
- **THEN** el sistema no retorna ningún dato del grupo
