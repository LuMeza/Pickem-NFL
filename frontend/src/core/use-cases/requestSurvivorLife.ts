import type { SurvivorRepository } from '@/core/ports/SurvivorRepository'
import type { SurvivorLife } from '@/core/entities/survivor'

export interface RequestSurvivorLifeDeps {
  survivorRepository: SurvivorRepository
}

export interface RequestSurvivorLifeParams {
  groupId: string
  userId: string
  lifeNumber: SurvivorLife
}

/** Pide la siguiente vida extra tras perder — ver design.md decision 7. */
export function requestSurvivorLife(
  deps: RequestSurvivorLifeDeps,
  params: RequestSurvivorLifeParams,
): Promise<void> {
  return deps.survivorRepository.requestLife(params.groupId, params.userId, params.lifeNumber)
}
