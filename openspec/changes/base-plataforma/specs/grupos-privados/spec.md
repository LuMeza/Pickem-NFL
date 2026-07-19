## ADDED Requirements

### Requirement: Creación de grupo privado exclusiva por el administrador
Solo el administrador de plataforma SHALL poder crear un grupo privado. El sistema SHALL generar automáticamente un código de invitación al crear el grupo.

#### Scenario: Administrador crea un grupo
- **WHEN** el administrador de plataforma envía un nombre de grupo válido
- **THEN** el sistema crea el grupo y genera un código de invitación inicial

#### Scenario: Usuario regular intenta crear un grupo
- **WHEN** un usuario autenticado que no es administrador de plataforma intenta crear un grupo
- **THEN** el sistema rechaza la operación

### Requirement: Invitación por link o código, generada solo por el administrador
El administrador de plataforma SHALL poder obtener el código/link de invitación de cualquier grupo y regenerarlo cuando lo necesite.

#### Scenario: Obtener código de invitación
- **WHEN** el administrador abre la sección de invitación de un grupo
- **THEN** el sistema muestra el código/link vigente para compartir fuera de la plataforma

#### Scenario: Regenerar código
- **WHEN** el administrador solicita regenerar el código de invitación de un grupo
- **THEN** el sistema invalida el código anterior y genera uno nuevo, de forma que links previos ya no permiten unirse

### Requirement: Unirse a un grupo mediante invitación
Un usuario autenticado (dado de alta previamente por el administrador) SHALL poder unirse por sí mismo a un grupo existente usando un código o link de invitación válido, sin intervención adicional del administrador.

#### Scenario: Unión exitosa
- **WHEN** un usuario autenticado abre un link de invitación válido o ingresa un código válido
- **THEN** el sistema lo agrega como miembro del grupo

#### Scenario: Código inválido o revocado
- **WHEN** un usuario intenta unirse con un código que no existe o fue regenerado
- **THEN** el sistema rechaza la unión y muestra un mensaje de error

#### Scenario: Usuario ya es miembro
- **WHEN** un usuario que ya pertenece al grupo intenta unirse de nuevo con el mismo código
- **THEN** el sistema no crea una membresía duplicada

### Requirement: Administración de miembros por el administrador de plataforma
El administrador de plataforma SHALL poder ver la lista de miembros de cualquier grupo y remover a un miembro de ese grupo.

#### Scenario: Ver miembros
- **WHEN** el administrador abre la pantalla de miembros de un grupo
- **THEN** el sistema muestra la lista de todos los miembros actuales

#### Scenario: Remover miembro
- **WHEN** el administrador remueve a un miembro de un grupo
- **THEN** el sistema elimina su membresía y ese usuario deja de ver los datos del grupo

#### Scenario: Miembro sin permisos de administración
- **WHEN** un usuario que no es administrador de plataforma intenta remover a otro miembro de un grupo
- **THEN** el sistema rechaza la acción por falta de permisos

### Requirement: Solicitud y aprobación de acceso a un módulo opcional
El sistema SHALL permitir registrar, por cada combinación de grupo, usuario y módulo, un estado de acceso (solicitado, aprobado, rechazado), gestionable exclusivamente por el administrador de plataforma. Esta es la base genérica que usarán los módulos de juego que requieran aprobación explícita (p. ej. Quiniela Semanal); las reglas específicas de cada módulo se definen en su propio spec.

#### Scenario: Usuario solicita acceso a un módulo
- **WHEN** un miembro del grupo solicita acceso a un módulo que requiere aprobación
- **THEN** el sistema registra el estado como "solicitado" para ese usuario, grupo y módulo

#### Scenario: Administrador aprueba una solicitud
- **WHEN** el administrador de plataforma aprueba una solicitud de acceso pendiente
- **THEN** el sistema cambia el estado a "aprobado" para ese usuario, grupo y módulo

#### Scenario: Administrador rechaza una solicitud
- **WHEN** el administrador de plataforma rechaza una solicitud de acceso pendiente
- **THEN** el sistema cambia el estado a "rechazado" para ese usuario, grupo y módulo

#### Scenario: Usuario sin acceso aprobado no puede participar
- **WHEN** un usuario sin estado "aprobado" para un módulo intenta registrar datos propios de ese módulo (p. ej. una predicción)
- **THEN** el sistema rechaza la operación

### Requirement: Aislamiento de datos entre grupos
El sistema SHALL asegurar que los datos de un grupo (miembros, accesos a módulos, invitaciones) solo sean visibles para los usuarios que pertenecen a ese grupo o para el administrador de plataforma.

#### Scenario: Usuario ajeno intenta ver datos de otro grupo
- **WHEN** un usuario autenticado que no pertenece a un grupo ni es administrador de plataforma intenta consultar los datos de ese grupo directamente
- **THEN** el sistema no retorna ningún dato del grupo
