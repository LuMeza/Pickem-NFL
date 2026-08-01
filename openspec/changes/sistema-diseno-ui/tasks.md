## 1. Fundacion de tokens

- [x] 1.1 Declarar tokens de color como CSS custom properties (`--bg-base`, `--bg-surface`, `--glass-border`, `--accent-lime`, `--accent-gold`, `--danger`, `--text-primary`, `--text-muted`)
- [x] 1.2 Cargar fuentes Bebas Neue, Inter y JetBrains Mono (Google Fonts, con `font-display: swap` y pesos acotados)
- [x] 1.3 Definir escala tipografica (display 40/32/24, body 16/14, mono 14/12 tabular-nums) como clases/utilidades reutilizables
- [x] 1.4 Definir mixin/clase de superficie glass (`background`, `backdrop-filter: blur(16px)`, borde `--glass-border`)

## 2. Shell responsivo (`layout-responsivo`)

- [x] 2.1 Definir breakpoints mobile (<768px) / tablet (768-1023px) / desktop (≥1024px) como constantes compartidas
- [x] 2.2 Componente `AppShell`: header + slot de navegación + ticker + slot de contenido
- [x] 2.3 Header: grupo activo, semana/ronda actual, cuenta regresiva (`HH:MM:SS`), versión colapsada para mobile
- [x] 2.4 Navegación inferior fija (mobile y tablet) con 4 accesos: Quiniela / Survivor / Playoffs / Perfil
- [x] 2.5 Sidebar fijo (desktop) con la misma navegación, sustituyendo la barra inferior
- [x] 2.6 Grid de partidos responsivo: 1 columna mobile, 2 columnas tablet, 3 columnas desktop
- [x] 2.7 Componente `Ticker`: scroll horizontal continuo, contenido rotativo, pausa en hover/tap
- [x] 2.8 Alternativa de `Ticker` con paginación manual cuando `prefers-reduced-motion` está activo

## 3. Componente de carta de predicción (`diseno-visual`)

- [x] 3.1 Componente `PredictionCard` base: estados sin elegir / elegido / cerrado (acierto/fallo)
- [x] 3.2 Variante `binary` (dos equipos enfrentados) para Quiniela Semanal y Survivor
- [x] 3.3 Variante `triple` (local amplio / cerrado / visita amplio) para Playoffs
- [x] 3.4 Animación de flip (rotateY, 300ms, ease-out) al confirmar una elección
- [x] 3.5 Estado adicional "bloqueada" (ícono de candado, sin flip habilitado) para partidos sin acceso o ya cerrados
- [x] 3.6 Alternativa de cross-fade instantáneo del flip cuando `prefers-reduced-motion` está activo
- [x] 3.7 Objetivo táctil mínimo 44×44px en las opciones de la carta; activables también con Enter/Space

## 4. Estados vacíos y de error

- [x] 4.1 Copys estándar: sin acceso a módulo opcional, semana cerrada sin picks, grupo sin miembros, error de carga de resultados (según `doc/design-system.md` §7)
- [x] 4.2 Componente reutilizable de estado vacío/error con el tono definido (directo, sin disculpas, sin emojis)

## 5. Guardrails y accesibilidad

- [x] 5.1 Checklist/lint manual de contenido: sin símbolos de moneda, montos, ni "pagar"/"cobrar"/"premio" con cifra en ninguna pantalla
- [x] 5.2 Verificación de contraste AA de `--text-muted` sobre `--bg-surface` con blur aplicado
- [x] 5.3 Verificación de foco de teclado visible (outline lime 2px) en navegación y cartas
