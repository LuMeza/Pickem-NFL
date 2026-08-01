## Why

Se definió un sistema de diseño completo (`doc/design-system.md`) para que la app
se sienta como "quiniela de cartas" en vez de un formulario genérico, con
prioridad total a mobile ya que la mayoría de usuarios entra desde el celular a
hacer su pick antes del cierre. Sin un shell responsivo y un set de tokens/
componentes compartidos, cada módulo (Quiniela Semanal, Survivor, Playoffs)
terminaría reimplementando su propia navegación y su propia tarjeta de
predicción de forma inconsistente. Se propone como change transversal, base para
la UI de los tres módulos.

## What Changes

- Tokens de diseño (paleta de color, tipografía, espaciado) aplicados de forma
  consistente en toda la app, según `doc/design-system.md`.
- Shell responsivo con **tres breakpoints explícitos**: mobile (<768px), tablet
  (768-1023px) y desktop (≥1024px) — navegación inferior fija en mobile/tablet,
  sidebar fijo en desktop, grid de partidos de 1/2/3 columnas respectivamente.
  Cubre web, tablet y celular como se pidió.
  Header persistente con grupo activo, semana/ronda actual y cuenta regresiva de
  cierre.
- Componente de "carta de predicción" reutilizable entre los 3 módulos (estados
  sin elegir / elegido / cerrado con acierto o fallo, variante binaria para
  Quiniela y Survivor, variante triple-opción para Playoffs).
- Ticker informativo "EN JUEGO", pausable, sin datos de dinero.
- Refuerzo formal (a nivel de sistema de diseño, no solo copy por módulo) de la
  restricción de no mostrar símbolos de moneda, montos ni palabras como "pagar",
  "cobrar" o "premio" junto a una cifra en ninguna pantalla.
- Accesibilidad base: contraste AA, objetivo táctil mínimo 44×44px, foco de
  teclado visible, soporte a `prefers-reduced-motion`.

## Capabilities

### New Capabilities
- `diseno-visual`: tokens de diseño, componente de carta de predicción
  compartido, restricción de contenido relacionado con dinero, accesibilidad
  base.
- `layout-responsivo`: breakpoints mobile/tablet/desktop, navegación persistente
  por módulo, header con cuenta regresiva, ticker informativo.

### Modified Capabilities
(ninguna)

## Impact

- Es la base visual/estructural que consumen `modulo-pickem-semanal`,
  `modulo-survivor` y `modulo-playoffs` al construir sus pantallas — no modifica
  las specs funcionales de esos changes (predicciones, tablas, cálculo de
  aciertos siguen igual), solo cómo se presentan.
- Requiere que `base-plataforma` esté implementada (grupos, catálogo NFL) para
  tener datos reales con los que poblar el header, el ticker y las cartas.
- No introduce ninguna excepción a la restricción de dinero definida en
  `base-plataforma`/`doc/requrimientov1.md` — la refuerza a nivel de sistema de
  diseño.
