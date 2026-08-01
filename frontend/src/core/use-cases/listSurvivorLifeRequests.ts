import type { SurvivorRepository } from '@/core/ports/SurvivorRepository'
import type { SurvivorLifeRequest } from '@/core/entities/survivor'

export interface ListSurvivorLifeRequestsDeps {
  survivorRepository: SurvivorRepository
}

export interface ListSurvivorLifeRequestsParams {
  groupId: string
}

/** Panel admin: solicitudes de vida de un grupo — ver design.md decision 7. */
export function listSurvivorLifeRequests(
  deps: ListSurvivorLifeRequestsDeps,
  params: ListSurvivorLifeRequestsParams,
): Promise<SurvivorLifeRequest[]> {
  return deps.survivorRepository.listLifeRequests(params.groupId)
}
