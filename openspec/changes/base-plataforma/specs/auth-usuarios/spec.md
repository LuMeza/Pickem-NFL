## ADDED Requirements

### Requirement: Registro de usuario con correo y contraseña
El sistema SHALL permitir que un usuario cree una cuenta usando correo electrónico y contraseña a través de Supabase Auth.

#### Scenario: Registro exitoso
- **WHEN** un visitante no autenticado envía un correo y contraseña válidos en el formulario de registro
- **THEN** el sistema crea la cuenta, crea un perfil básico asociado, y autentica al usuario

#### Scenario: Correo ya registrado
- **WHEN** un visitante intenta registrarse con un correo que ya tiene una cuenta
- **THEN** el sistema rechaza el registro y muestra un mensaje de error sin crear una cuenta duplicada

### Requirement: Inicio de sesión
El sistema SHALL permitir que un usuario con cuenta existente inicie sesión con correo y contraseña.

#### Scenario: Login exitoso
- **WHEN** un usuario registrado envía su correo y contraseña correctos
- **THEN** el sistema lo autentica y le da acceso a sus grupos

#### Scenario: Credenciales inválidas
- **WHEN** un usuario envía un correo o contraseña incorrectos
- **THEN** el sistema rechaza el inicio de sesión y muestra un mensaje de error sin revelar cuál dato fue incorrecto

### Requirement: Perfil básico de usuario
Cada usuario autenticado SHALL tener un perfil con al menos nombre visible (display name) y correo, editable por el propio usuario.

#### Scenario: Edición de nombre visible
- **WHEN** un usuario autenticado actualiza su nombre visible desde su perfil
- **THEN** el sistema guarda el cambio y lo refleja en los grupos donde participa

### Requirement: Acceso exclusivo a usuarios autenticados
El sistema SHALL requerir sesión autenticada para acceder a cualquier dato de grupos, predicciones o resultados; solo pantallas públicas (login/registro) son accesibles sin sesión.

#### Scenario: Usuario no autenticado intenta acceder
- **WHEN** un visitante sin sesión intenta acceder a una pantalla de grupo o predicciones
- **THEN** el sistema lo redirige a la pantalla de login sin exponer datos
