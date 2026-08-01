import type { ResultsRepository } from '@/core/ports/ResultsRepository'
import type { GameResult } from '@/core/entities/gameResult'

export interface GetGameResultDeps {
  resultsRepository: ResultsRepository
}

export interface GetGameResultParams {
  gameId: string
}

/** Consulta de resultado (lectura publica para autenticados) — ver openspec/changes/base-plataforma specs/carga-resultados. */
export function getGameResult(deps: GetGameResultDeps, params: GetGameResultParams): Promise<GameResult | null> {
  return deps.resultsRepository.getResult(params.gameId)
}
