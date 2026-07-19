## ADDED Requirements

### Requirement: Tokens de diseño consistentes
Todo componente visual nuevo SHALL usar los tokens de color y tipografía definidos en `doc/design-system.md` (paleta, roles tipográficos) en vez de valores ad-hoc.

#### Scenario: Nuevo componente usa tokens existentes
- **WHEN** se construye un componente visual nuevo en la app
- **THEN** sus colores y fuentes provienen de los tokens definidos en el sistema de diseño, sin valores hardcodeados fuera de esos tokens

### Requirement: Componente de carta de predicción reutilizable
El sistema SHALL implementar un único componente de carta de predicción, compartido entre los módulos de Quiniela Semanal, Survivor y Playoffs, con los estados: sin elegir, elegido, y cerrado (con resultado de acierto o fallo).

#### Scenario: Estado sin elegir
- **WHEN** un usuario abre la pantalla de predicción de un partido que aún no tiene pick guardado
- **THEN** la carta se muestra en su estado "sin elegir", con las opciones disponibles para seleccionar

#### Scenario: Confirmar una elección
- **WHEN** un usuario selecciona una opción en una carta sin elegir y el partido aún no inició
- **THEN** la carta pasa a su estado "elegido", mostrando la opción seleccionada de forma destacada

#### Scenario: Carta cerrada con resultado
- **WHEN** el partido de una carta ya finalizó y tiene resultado oficial cargado
- **THEN** la carta se muestra en estado "cerrado", indicando si el pick guardado fue acierto o fallo, sin permitir más interacción

### Requirement: Variante de tres opciones para Playoffs
El componente de carta de predicción SHALL soportar una variante de tres opciones (local amplio / cerrado / visita amplio) para el módulo de Playoffs, además de su variante binaria (equipo A / equipo B) usada por Quiniela Semanal y Survivor.

#### Scenario: Carta de Playoffs con tres opciones
- **WHEN** se muestra una carta de predicción para un partido del módulo de Playoffs
- **THEN** la carta presenta las tres opciones de rango de diferencia de puntos en vez de dos equipos enfrentados

### Requirement: Restricción de contenido relacionado con dinero
El sistema SHALL NOT mostrar en ninguna pantalla símbolos de moneda, montos, ni las palabras "pagar", "cobrar" o "premio" junto a una cifra. Los únicos indicadores permitidos relacionados con el acceso a módulos opcionales SHALL ser de estado (por ejemplo "pendiente de aprobación" o "activo"), nunca un monto.

#### Scenario: Pantalla de estado de acceso a módulo opcional
- **WHEN** se muestra el estado de acceso de un usuario a un módulo opcional como la Quiniela Semanal
- **THEN** el indicador mostrado es un badge de estado (pendiente/aprobado/rechazado), sin ninguna cifra de dinero

### Requirement: Accesibilidad mínima
El sistema SHALL cumplir contraste mínimo AA en texto, un objetivo táctil mínimo de 44×44px en elementos interactivos, foco de teclado visible en toda la navegación, y SHALL respetar la preferencia `prefers-reduced-motion` del usuario.

#### Scenario: Usuario con reduced motion activado
- **WHEN** un usuario tiene activada la preferencia de sistema `prefers-reduced-motion`
- **THEN** las animaciones (flip de carta, scroll del ticker) se reemplazan por alternativas estáticas o instantáneas

#### Scenario: Navegación por teclado
- **WHEN** un usuario navega la app usando solo el teclado
- **THEN** puede recorrer y activar todos los controles interactivos, incluida la selección de una carta de predicción, con foco visible en cada paso
