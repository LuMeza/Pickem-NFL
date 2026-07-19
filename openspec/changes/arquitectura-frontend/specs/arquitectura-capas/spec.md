## ADDED Requirements

### Requirement: Organización del código en tres capas
El código del frontend SHALL organizarse en tres capas: `core` (entidades, reglas de negocio y casos de uso, sin dependencias de Supabase ni de React), `infrastructure` (adapters concretos de acceso a datos) y `presentation` (componentes y pantallas de React).

#### Scenario: Ubicación de una regla de negocio nueva
- **WHEN** se agrega una regla de negocio nueva al sistema (por ejemplo, una condición de bloqueo o de cálculo)
- **THEN** esa regla se implementa dentro de `core`, sin importar `supabase-js` ni componentes de React

### Requirement: Acceso a datos exclusivamente a través de repositorios
Ningún componente de la capa de presentación SHALL invocar directamente al cliente de Supabase. Toda lectura o escritura de datos SHALL pasar por un caso de uso de `core` que depende de una interfaz de repositorio (`port`), implementada por un adapter en `infrastructure`.

#### Scenario: Un componente necesita guardar datos
- **WHEN** una pantalla necesita guardar o modificar datos (por ejemplo, una predicción o una aprobación de acceso)
- **THEN** invoca un caso de uso de `core` a través de un hook, sin construir ni ejecutar directamente una consulta a Supabase

#### Scenario: Import directo de supabase-js fuera de infrastructure
- **WHEN** un archivo fuera de la carpeta `infrastructure` intenta importar el cliente de Supabase
- **THEN** esa importación se considera una violación de la arquitectura y SHALL detectarse antes de integrarse (revisión de código o regla de lint)

### Requirement: Casos de uso como punto único de la lógica de negocio con efectos
Toda acción que modifique datos o dispare una regla de negocio con efectos (guardar una predicción, aprobar un acceso, cargar un resultado, dar de alta un usuario) SHALL implementarse como un caso de uso en `core/use-cases`, reutilizable entre distintas pantallas cuando aplique.

#### Scenario: Dos pantallas necesitan la misma acción
- **WHEN** dos pantallas distintas necesitan ejecutar la misma acción de negocio
- **THEN** ambas invocan el mismo caso de uso de `core`, en vez de duplicar su lógica en cada pantalla

### Requirement: Row Level Security como defensa en profundidad
La organización en capas SHALL complementar, no reemplazar, las políticas de Row Level Security ya definidas en el esquema de datos. Ninguna capa de la aplicación SHALL asumir que una operación es segura solo porque un caso de uso ya validó la condición de negocio en el cliente.

#### Scenario: Solicitud que evade la aplicación
- **WHEN** una solicitud de escritura llega a Supabase por un medio distinto a la aplicación (por ejemplo, el dashboard de Supabase o un cliente HTTP directo) sin pasar por ningún caso de uso
- **THEN** las políticas de Row Level Security igual determinan si la operación se permite o se rechaza
