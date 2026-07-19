import type { ManualGameResult } from '@/core/entities/gameResult'
import type { ResultsRepository } from '@/core/ports/ResultsRepository'

export interface SubmitGameResultDeps {
  resultsRepository: ResultsRepository
}

/** Carga/edicion de resultado oficial por el administrador — ver openspec/changes/base-plataforma specs/carga-resultados. */
export function submitGameResult(deps: SubmitGameResultDeps, result: ManualGameResult): Promise<void> {
  return deps.resultsRepository.setResult(result)
}
