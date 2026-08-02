/**
 * Tarea 2.1 (sistema-diseno-ui): breakpoints compartidos. Deben coincidir con
 * --bp-tablet/--bp-desktop en src/index.css — se mantienen ambos porque CSS
 * media queries no pueden leer custom properties, y estos valores también
 * los necesita JS (Ticker, Header) para logica que no es solo estilo.
 */
export const BREAKPOINT_TABLET_PX = 768
export const BREAKPOINT_DESKTOP_PX = 1024

export type ViewportRange = 'mobile' | 'tablet' | 'desktop'

export function getViewportRange(widthPx: number): ViewportRange {
  if (widthPx >= BREAKPOINT_DESKTOP_PX) return 'desktop'
  if (widthPx >= BREAKPOINT_TABLET_PX) return 'tablet'
  return 'mobile'
}
