import type { SurvivorState, SurvivorWeeklyOutcome } from '@/core/entities/survivor'

/**
 * Regla de Survivor (ver openspec/changes/modulo-survivor/design.md, decision 4
 * y openspec/changes/arquitectura-frontend, tarea 3.7).
 * Procesa la transición de estado de un usuario para una semana ya resuelta.
 * Un usuario ya eliminado no cambia de estado (función idempotente ante
 * reprocesamiento de semanas ya cerradas).
 */
export function applySurvivorWeeklyOutcome(
  state: SurvivorState,
  weekId: string,
  outcome: SurvivorWeeklyOutcome,
): SurvivorState {
  if (state.status === 'eliminated') {
    return state
  }

  if (outcome === 'win') {
    return state
  }

  const firstLossWeekId = state.currentLife === 1 ? weekId : state.firstLossWeekId

  if (state.currentLife < 3) {
    return {
      ...state,
      currentLife: (state.currentLife + 1) as SurvivorState['currentLife'],
      firstLossWeekId,
    }
  }

  return {
    ...state,
    status: 'eliminated',
    eliminatedWeekId: weekId,
    firstLossWeekId,
  }
}
