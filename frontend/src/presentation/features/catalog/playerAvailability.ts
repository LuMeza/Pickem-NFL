export type AvailabilityTone = 'active' | 'questionable' | 'injured'

export interface Availability {
  tone: AvailabilityTone
  label: string
}

/** Estados de roster de largo plazo (`status`) que se muestran como "Lesionado" sin importar si hay o no designación semanal. */
const LONG_TERM_INJURED_STATUSES = new Set(['Injured Reserve', 'PUP', 'Suspended'])

/** Designaciones semanales (`injuryStatus`, valores reales confirmados contra site.web.api.espn.com/.../injuries) que se muestran como "Lesionado". */
const WEEKLY_INJURED_STATUSES = new Set(['Out', 'IR', 'Suspension'])

/** Designaciones semanales que se muestran como "Cuestionable". */
const WEEKLY_QUESTIONABLE_STATUSES = new Set(['Questionable', 'Doubtful'])

/**
 * Combina el estado de roster de largo plazo (`status`, ej. "Injured Reserve")
 * con la designación semanal (`injuryStatus`, ej. "Questionable") en un
 * semáforo de 3 estados para la plantilla. Manda la severidad: un IR/PUP/
 * Suspended de temporada siempre es "Lesionado", aunque no haya tag semanal.
 * Cualquier valor de ESPN no reconocido (incluido "Active", que el reporte
 * semanal también usa para notas informativas de jugadores recuperados) cae
 * en "Activo" por defecto — nunca marcar a alguien como lesionado por un
 * string inesperado.
 */
export function getAvailability(player: { status: string | null; injuryStatus: string | null }): Availability {
  if (player.status && LONG_TERM_INJURED_STATUSES.has(player.status)) {
    return { tone: 'injured', label: 'Lesionado' }
  }
  if (player.injuryStatus && WEEKLY_INJURED_STATUSES.has(player.injuryStatus)) {
    return { tone: 'injured', label: 'Lesionado' }
  }
  if (player.injuryStatus && WEEKLY_QUESTIONABLE_STATUSES.has(player.injuryStatus)) {
    return { tone: 'questionable', label: 'Cuestionable' }
  }
  return { tone: 'active', label: 'Activo' }
}
