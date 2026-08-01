import type { SurvivorRepository } from '@/core/ports/SurvivorRepository'
import type { SurvivorParticipant } from '@/core/entities/survivor'

export interface ListSurvivorGroupStateDeps {
  survivorRepository: SurvivorRepository
}

export interface ListSurvivorGroupStateParams {
  groupId: string
}

/** Estado y roster de Survivor del grupo — ver specs/estado-survivor. */
export function listSurvivorGroupState(
  deps: ListSurvivorGroupStateDeps,
  params: ListSurvivorGroupStateParams,
): Promise<SurvivorParticipant[]> {
  return deps.survivorRepository.listGroupState(params.groupId)
}
