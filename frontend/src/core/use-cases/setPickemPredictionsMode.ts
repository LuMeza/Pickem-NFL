import type { PickemStandingsRepository } from '@/core/ports/PickemStandingsRepository'
import type { PredictionsMode } from '@/core/entities/gamePrediction'

export interface SetPickemPredictionsModeDeps {
  pickemStandingsRepository: PickemStandingsRepository
}

export interface SetPickemPredictionsModeParams {
  groupId: string
  mode: PredictionsMode
}

/** Panel admin: cambiar el modo de visibilidad de pronósticos del grupo — ver specs/pronosticos-partidos. */
export function setPickemPredictionsMode(
  deps: SetPickemPredictionsModeDeps,
  params: SetPickemPredictionsModeParams,
): Promise<void> {
  return deps.pickemStandingsRepository.setPredictionsMode(params.groupId, params.mode)
}
