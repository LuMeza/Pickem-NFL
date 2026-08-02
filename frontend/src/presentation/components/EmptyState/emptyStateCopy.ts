/**
 * Tarea 4.1 (sistema-diseno-ui): copys estandar de estados vacios/error, ver
 * doc/design-system.md §7. Tono directo, sin disculpas, sin emojis.
 */
export const EMPTY_STATE_COPY = {
  noModuleAccess: 'Todavía no tienes acceso a este módulo. Pídele al administrador que lo active.',
  weekClosedNoPicks: 'No registraste predicciones esta semana.',
  groupWithoutMembers: 'Todavía no hay usuarios. Dalos de alta desde el panel admin para que aparezcan aquí.',
  resultsLoadError: 'No pudimos actualizar los resultados. Intenta de nuevo.',
  noWeeksAvailable: 'Todavía no hay semanas cargadas.',
  pageNotFound: 'Esta página no existe.',
} as const
