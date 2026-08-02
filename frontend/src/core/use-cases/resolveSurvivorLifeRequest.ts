import type { SurvivorLifeRequestDecision, SurvivorRepository } from '@/core/ports/SurvivorRepository'

export interface ResolveSurvivorLifeRequestDeps {
  survivorRepository: SurvivorRepository
}

export interface ResolveSurvivorLifeRequestParams {
  requestId: string
  decision: SurvivorLifeRequestDecision
}

/** Aprobación/rechazo de una solicitud de vida por el administrador — ver design.md decision 7. */
export function resolveSurvivorLifeRequest(
  deps: ResolveSurvivorLifeRequestDeps,
  params: ResolveSurvivorLifeRequestParams,
): Promise<void> {
  return deps.survivorRepository.resolveLifeRequest(params.requestId, params.decision)
}
