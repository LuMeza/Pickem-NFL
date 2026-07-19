## ADDED Requirements

### Requirement: Tres rangos de breakpoint sin zonas ambiguas
El sistema SHALL adaptar su layout en exactamente tres rangos de ancho de pantalla: mobile (menor a 768px), tablet (768px a 1023px) y desktop (1024px en adelante), de forma que todo ancho de pantalla caiga en uno de los tres sin comportamiento indefinido.

#### Scenario: Ancho de pantalla mobile
- **WHEN** el ancho de la ventana es menor a 768px
- **THEN** el sistema aplica el layout definido para mobile (navegación inferior, grid de 1 columna)

#### Scenario: Ancho de pantalla tablet
- **WHEN** el ancho de la ventana está entre 768px y 1023px
- **THEN** el sistema aplica el layout definido para tablet (navegación inferior, grid de 2 columnas)

#### Scenario: Ancho de pantalla desktop
- **WHEN** el ancho de la ventana es 1024px o mayor
- **THEN** el sistema aplica el layout definido para desktop (sidebar fijo, grid de 3 columnas)

### Requirement: Navegación persistente por módulo
En mobile y tablet, la navegación entre módulos SHALL mostrarse como una barra inferior fija con acceso a Quiniela Semanal, Survivor, Playoffs y Perfil. En desktop, esa misma navegación SHALL mostrarse como un sidebar fijo en vez de barra inferior.

#### Scenario: Navegación en mobile o tablet
- **WHEN** un usuario navega la app en un ancho de pantalla mobile o tablet
- **THEN** ve una barra de navegación fija en la parte inferior con acceso directo a los 3 módulos y su perfil

#### Scenario: Navegación en desktop
- **WHEN** un usuario navega la app en un ancho de pantalla desktop
- **THEN** ve un sidebar fijo con la misma navegación, en vez de la barra inferior

### Requirement: Header con contexto y cuenta regresiva de cierre
El sistema SHALL mostrar un header persistente con el grupo activo, la semana o ronda actual, y una cuenta regresiva al cierre de predicciones vigente, en los tres breakpoints.

#### Scenario: Header en mobile
- **WHEN** un usuario ve el header en mobile
- **THEN** el header muestra al menos el escudo/nombre del grupo y la cuenta regresiva, en su forma colapsada

#### Scenario: Header en tablet o desktop
- **WHEN** un usuario ve el header en tablet o desktop
- **THEN** el header muestra el grupo activo, la semana/ronda actual y la cuenta regresiva completos

### Requirement: Ticker informativo sin datos de dinero
El sistema SHALL mostrar una franja de información rotativa con datos relevantes de la actividad del grupo (cierres próximos, rachas, cambios en el top de tabla), pausable al hacer hover o tap, sin incluir montos ni referencias a dinero.

#### Scenario: Pausar el ticker
- **WHEN** un usuario hace hover o tap sobre el ticker
- **THEN** el desplazamiento del contenido se pausa hasta que el usuario deje de interactuar con él

#### Scenario: Ticker con reduced motion activado
- **WHEN** un usuario tiene activada la preferencia `prefers-reduced-motion`
- **THEN** el ticker deja de desplazarse automáticamente y ofrece paginación manual del contenido
