## ADDED Requirements

### Requirement: Alta de usuario exclusiva por el administrador
El sistema SHALL NOT ofrecer registro público de cuentas. Solo el administrador de plataforma SHALL poder dar de alta un nuevo usuario, indicando su correo y nombre visible.

#### Scenario: Administrador da de alta un usuario
- **WHEN** el administrador de plataforma completa el formulario de alta con correo y nombre de un usuario nuevo
- **THEN** el sistema crea la cuenta, genera una contraseña provisional, crea el perfil básico asociado y marca la cuenta como pendiente de cambio de contraseña

#### Scenario: Visitante intenta registrarse por su cuenta
- **WHEN** un visitante no autenticado intenta acceder a un flujo de registro público
- **THEN** el sistema no ofrece ningún formulario de auto-registro

### Requirement: Entrega de contraseña provisional
El sistema SHALL mostrar la contraseña provisional generada al administrador una única vez, inmediatamente después de dar de alta al usuario, para que la entregue por fuera de la plataforma.

#### Scenario: Mostrar contraseña tras el alta
- **WHEN** el sistema termina de crear un usuario nuevo
- **THEN** el sistema muestra la contraseña provisional al administrador en pantalla, sin enviarla por correo ni otro medio

### Requirement: Cambio de contraseña obligatorio en el primer inicio de sesión
El sistema SHALL requerir que un usuario con contraseña provisional pendiente cambie su contraseña inmediatamente después de iniciar sesión por primera vez, antes de permitirle acceder a cualquier otra pantalla.

#### Scenario: Primer login con contraseña provisional
- **WHEN** un usuario inicia sesión con su contraseña provisional por primera vez
- **THEN** el sistema lo dirige a una pantalla obligatoria de cambio de contraseña y bloquea el acceso a cualquier otra funcionalidad hasta completarla

#### Scenario: Cambio de contraseña completado
- **WHEN** el usuario define una nueva contraseña en la pantalla obligatoria de cambio
- **THEN** el sistema actualiza la contraseña, marca la cuenta como sin cambio pendiente, y le da acceso normal al resto de la app

### Requirement: Inicio de sesión
El sistema SHALL permitir que un usuario con cuenta existente inicie sesión con correo y contraseña.

#### Scenario: Login exitoso
- **WHEN** un usuario registrado envía su correo y contraseña correctos
- **THEN** el sistema lo autentica y le da acceso a sus grupos (o a la pantalla obligatoria de cambio de contraseña si aún la tiene pendiente)

#### Scenario: Credenciales inválidas
- **WHEN** un usuario envía un correo o contraseña incorrectos
- **THEN** el sistema rechaza el inicio de sesión y muestra un mensaje de error sin revelar cuál dato fue incorrecto

### Requirement: Perfil básico de usuario
Cada usuario autenticado SHALL tener un perfil con al menos nombre visible (display name) y correo, editable por el propio usuario.

#### Scenario: Edición de nombre visible
- **WHEN** un usuario autenticado actualiza su nombre visible desde su perfil
- **THEN** el sistema guarda el cambio y lo refleja en los grupos donde participa

### Requirement: Acceso exclusivo a usuarios autenticados
El sistema SHALL requerir sesión autenticada para acceder a cualquier dato de grupos, predicciones o resultados; solo la pantalla de login es accesible sin sesión.

#### Scenario: Usuario no autenticado intenta acceder
- **WHEN** un visitante sin sesión intenta acceder a una pantalla de grupo o predicciones
- **THEN** el sistema lo redirige a la pantalla de login sin exponer datos
