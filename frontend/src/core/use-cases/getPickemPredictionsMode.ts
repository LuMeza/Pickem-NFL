import type { PickemStandingsRepository } from '@/core/ports/PickemStandingsRepository'
import type { PredictionsMode } from '@/core/entities/gamePrediction'

export interface GetPickemPredictionsModeDeps {
  pickemStandingsRepository: PickemStandingsRepository
}

export interface GetPickemPredictionsModeParams {
  groupId: string
}

/** Panel admin: modo de visibilidad de pronósticos del grupo — ver specs/pronosticos-partidos. */
export function getPickemPredictionsMode(
  deps: GetPickemPredictionsModeDeps,
  params: GetPickemPredictionsModeParams,
): Promise<PredictionsMode> {
  return deps.pickemStandingsRepository.getPredictionsMode(params.groupId)
}
