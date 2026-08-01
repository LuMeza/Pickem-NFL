import type { PickemStandingsRepository } from '@/core/ports/PickemStandingsRepository'

export interface GetPickemTablesVisibilityDeps {
  pickemStandingsRepository: PickemStandingsRepository
}

export interface GetPickemTablesVisibilityParams {
  groupId: string
}

/** Panel admin: valor crudo del flag de visibilidad — ver specs/tabla-pickem-semanal. */
export function getPickemTablesVisibility(
  deps: GetPickemTablesVisibilityDeps,
  params: GetPickemTablesVisibilityParams,
): Promise<boolean> {
  return deps.pickemStandingsRepository.getTablesVisibleToAll(params.groupId)
}
