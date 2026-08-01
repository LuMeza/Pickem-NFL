## ADDED Requirements

> **Actualizado post-implementación (feedback de producto):** se descarta el
> modelo de múltiples grupos con invitación por link/código. La plataforma
> opera con un **único grupo global**: todo usuario dado de alta por el
> administrador queda agregado automáticamente a ese grupo, sin flujo de
> creación de grupo ni de unión por código. Lo único que varía por usuario es
> su estado de acceso a cada módulo opcional que use este modelo genérico
> (p. ej. Survivor, Playoffs — Quiniela Semanal usa su propio modelo de acceso
> semanal, ver nota en el requirement de solicitud/aprobación más abajo). El
> esquema de datos (`groups`/`group_members`) no se eliminó — sigue siendo
> genérico por si en el futuro se retoma soporte a múltiples grupos — pero no
> hay ninguna pantalla ni requirement que exponga esa capacidad hoy.

### Requirement: Grupo único global, sin flujo de invitación
El sistema SHALL operar con un único grupo. Todo usuario dado de alta por el administrador de plataforma SHALL quedar agregado automáticamente a ese grupo al momento del alta, sin código ni link de invitación.

#### Scenario: Alta de usuario agrega al grupo automáticamente
- **WHEN** el administrador de plataforma da de alta a un usuario nuevo
- **THEN** el sistema lo agrega como miembro del único grupo de la plataforma en la misma operación, sin pasos adicionales

#### Scenario: No existe flujo de creación de grupos adicionales
- **WHEN** cualquier usuario, incluido el administrador de plataforma, busca una forma de crear un grupo nuevo o unirse por código
- **THEN** el sistema no ofrece esa funcionalidad

### Requirement: Administración de miembros por el administrador de plataforma
El administrador de plataforma SHALL poder ver la lista de miembros del grupo y remover a un miembro.

#### Scenario: Ver miembros
- **WHEN** el administrador abre la pantalla de miembros
- **THEN** el sistema muestra la lista de todos los miembros actuales

#### Scenario: Remover miembro
- **WHEN** el administrador remueve a un miembro
- **THEN** el sistema elimina su membresía

#### Scenario: Miembro sin permisos de administración
- **WHEN** un usuario que no es administrador de plataforma intenta remover a otro miembro
- **THEN** el sistema rechaza la acción por falta de permisos

### Requirement: Solicitud y aprobación de acceso a un módulo opcional
El sistema SHALL permitir registrar, por cada combinación de usuario y módulo, un estado de acceso (solicitado, aprobado, rechazado), gestionable exclusivamente por el administrador de plataforma. Esta es la base genérica que usarán los módulos de juego que requieran aprobación explícita a nivel de temporada (p. ej. Survivor, Playoffs); las reglas específicas de cada módulo se definen en su propio spec.

> **Nota (`modulo-pickem-semanal`):** la Quiniela Semanal NO usa este modelo genérico de acceso por módulo — requiere aprobación semana a semana, no una única aprobación por temporada, así que define su propio modelo de acceso (`weekly_access`) en su propio spec.

#### Scenario: Usuario solicita acceso a un módulo
- **WHEN** un usuario solicita acceso a un módulo que requiere aprobación
- **THEN** el sistema registra el estado como "solicitado" para ese usuario y módulo

#### Scenario: Administrador aprueba una solicitud
- **WHEN** el administrador de plataforma aprueba una solicitud de acceso pendiente
- **THEN** el sistema cambia el estado a "aprobado" para ese usuario y módulo

#### Scenario: Administrador rechaza una solicitud
- **WHEN** el administrador de plataforma rechaza una solicitud de acceso pendiente
- **THEN** el sistema cambia el estado a "rechazado" para ese usuario y módulo

#### Scenario: Usuario sin acceso aprobado no puede participar
- **WHEN** un usuario sin estado "aprobado" para un módulo intenta registrar datos propios de ese módulo (p. ej. una predicción)
- **THEN** el sistema rechaza la operación
