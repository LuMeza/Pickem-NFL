import type { SurvivorRepository } from '@/core/ports/SurvivorRepository'
import type { SurvivorPick } from '@/core/entities/survivor'

export interface ListMySurvivorPicksDeps {
  survivorRepository: SurvivorRepository
}

export interface ListMySurvivorPicksParams {
  groupId: string
  userId: string
}

/** Elecciones propias de Survivor en la temporada — ver specs/prediccion-survivor. */
export function listMySurvivorPicks(
  deps: ListMySurvivorPicksDeps,
  params: ListMySurvivorPicksParams,
): Promise<SurvivorPick[]> {
  return deps.survivorRepository.listMyPicks(params.groupId, params.userId)
}
