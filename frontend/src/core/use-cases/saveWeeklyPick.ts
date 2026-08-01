import type { SaveWeeklyPickParams, WeeklyPickRepository } from '@/core/ports/WeeklyPickRepository'

export interface SaveWeeklyPickDeps {
  weeklyPickRepository: WeeklyPickRepository
}

/** Registrar/editar una prediccion antes del kickoff — ver specs/prediccion-pickem-semanal. */
export function saveWeeklyPick(deps: SaveWeeklyPickDeps, params: SaveWeeklyPickParams): Promise<void> {
  return deps.weeklyPickRepository.savePick(params)
}
