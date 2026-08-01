/**
 * Tarea 4.1 (sistema-diseno-ui): copys estandar de estados vacios/error, ver
 * doc/design-system.md §7. Tono directo, sin disculpas, sin emojis.
 */
export const EMPTY_STATE_COPY = {
  noModuleAccess: 'Todavia no tienes acceso a este modulo. Pidele al administrador que lo active.',
  weekClosedNoPicks: 'No registraste predicciones esta semana.',
  groupWithoutMembers: 'Todavia no hay usuarios. Dalos de alta desde el panel admin para que aparezcan aqui.',
  resultsLoadError: 'No pudimos actualizar los resultados. Intenta de nuevo.',
  noWeeksAvailable: 'Todavia no hay semanas cargadas.',
} as const
