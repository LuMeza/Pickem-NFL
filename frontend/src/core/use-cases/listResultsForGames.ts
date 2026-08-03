import type { ResultsRepository } from '@/core/ports/ResultsRepository'
import type { GameResult } from '@/core/entities/gameResult'

export interface ListResultsForGamesDeps {
  resultsRepository: ResultsRepository
}

export interface ListResultsForGamesParams {
  gameIds: string[]
}

/** Consulta en lote de resultados — evita disparar getResult por cada partido al pintar una tabla. */
export function listResultsForGames(
  deps: ListResultsForGamesDeps,
  params: ListResultsForGamesParams,
): Promise<GameResult[]> {
  return deps.resultsRepository.getResultsForGames(params.gameIds)
}
