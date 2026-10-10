import type { PredictionsRepository } from '@/core/ports/PredictionsRepository'
import type { GamePrediction } from '@/core/entities/gamePrediction'

export interface ListPredictionsForGamesDeps {
  predictionsRepository: PredictionsRepository
}

export interface ListPredictionsForGamesParams {
  gameIds: string[]
}

/** Pronósticos visibles para el usuario de varios partidos en una sola consulta (hoja de picks). */
export function listPredictionsForGames(
  deps: ListPredictionsForGamesDeps,
  params: ListPredictionsForGamesParams,
): Promise<Map<string, GamePrediction>> {
  if (params.gameIds.length === 0) return Promise.resolve(new Map())
  return deps.predictionsRepository.listForGames(params.gameIds)
}
