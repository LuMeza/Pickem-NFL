## Context

`doc/design-system.md` define la identidad visual completa (paleta, tipografía,
componente de carta, patrones por módulo, movimiento, accesibilidad) pero no
decide cómo se implementa técnicamente en React ni cómo se comparte entre los 3
módulos de juego. Este change traduce ese documento de diseño a decisiones de
arquitectura de frontend.

## Goals / Non-Goals

**Goals:**
- Decidir cómo se implementan los tokens de diseño en el código (CSS custom
  properties vs. framework de utilidades).
- Definir el shell responsivo (header, nav, ticker) como componentes
  compartidos, no reimplementados por módulo.
- Definir el componente de carta de predicción como una única implementación
  parametrizable (variante binaria y variante triple-opción de Playoffs).
- Dejar explícito el comportamiento de navegación en el rango tablet, que
  `doc/design-system.md` no resolvía por completo.

**Non-Goals:**
- No se rediseña la identidad visual — `doc/design-system.md` es la fuente de
  verdad de paleta/tipografía/patrones; este design.md solo decide
  implementación.
- No se implementa contenido específico de ningún módulo (eso vive en
  `modulo-quiniela-semanal`, `modulo-survivor`, `modulo-playoffs`).

## Decisions

**1. Tokens como CSS custom properties globales**
Los tokens de `doc/design-system.md` (`--bg-base`, `--accent-lime`, etc.) se
declaran como CSS custom properties en el nivel raíz de la app y se consumen
desde CSS Modules por componente. Se descarta introducir un framework de
utilidades de terceros (Tailwind, Chakra, Material UI) porque el sistema de
diseño ya es muy específico (glassmorphism, tipografía condicionada por rol) y
esos frameworks añaden una capa de convenciones propias que compite con eso sin
aportar velocidad real acá. Decisión reversible sin romper specs si más adelante
se prefiere Tailwind — es detalle de implementación.

**2. Fuentes vía Google Fonts (Bebas Neue, Inter, JetBrains Mono)**
Carga por `<link>`/`@import` de Google Fonts en vez de self-hosting, para v1 —
más simple de mantener, aceptable para una app de grupos privados sin
requisitos estrictos de privacidad en carga de fuentes. Se puede migrar a
self-hosted después sin cambiar ningún requirement.

**3. Breakpoints y comportamiento de tablet**
Se definen tres breakpoints con `min-width`: mobile `<768px`, tablet
`768px-1023px`, desktop `≥1024px`. Para tablet, `doc/design-system.md` solo
definía el grid de partidos (2 columnas) sin resolver la navegación. Decisión:
tablet conserva la navegación inferior fija de mobile (no el sidebar de
desktop), porque en ese rango de ancho un sidebar persistente le resta espacio
útil al contenido de dos columnas sin ganar suficiente valor de navegación.

**4. Componente `PredictionCard` único y parametrizable**
Un solo componente `PredictionCard` con una prop `variant: "binary" | "triple"`
(`binary` para Quiniela Semanal y Survivor — dos equipos enfrentados;
`triple` para Playoffs — tres franjas de rango de diferencia) y estados
`unpicked | picked | locked-correct | locked-incorrect`. Cada módulo (change
`modulo-*`) lo consume pasándole los datos del partido y el callback de
guardado — evita 3 implementaciones divergentes del flip/estados.

**5. Shell responsivo como layout compartido**
`AppShell` (header + nav + ticker + slot de contenido) es un único componente de
layout que envuelve las pantallas de los 3 módulos y de perfil. La navegación
activa se resalta según la ruta actual; el contenido de cada módulo se monta en
el slot central sin reimplementar header/nav/ticker.

## Risks / Trade-offs

- [CSS custom properties + CSS Modules es más manual que un framework de
  utilidades] → Aceptado: el volumen de componentes es chico (una app de
  grupos privados, no un design system multi-producto); revisar si el proyecto
  crece mucho.
- [Cargar 3 familias tipográficas vía Google Fonts añade peso/latencia inicial,
  sensible en mobile] → Mitigar con `font-display: swap` y precarga solo de los
  pesos usados (no toda la familia).
- [Decisión de tablet = bottom nav puede sentirse "apretada" en tablets grandes
  cerca de 1024px] → Aceptado para v1; el umbral es ajustable sin romper
  ningún requirement (es un valor, no una regla estructural).

## Migration Plan

- No aplica migración de datos. Es la primera implementación del shell de UI;
  requiere que `base-plataforma` (grupos, catálogo) ya exista para tener datos
  reales que mostrar.
- Rollback: los componentes de shell/diseño son aditivos (no tocan esquema de
  base de datos); revertir es simplemente no montarlos.
