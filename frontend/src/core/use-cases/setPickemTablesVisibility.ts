import type { PickemStandingsRepository } from '@/core/ports/PickemStandingsRepository'

export interface SetPickemTablesVisibilityDeps {
  pickemStandingsRepository: PickemStandingsRepository
}

export interface SetPickemTablesVisibilityParams {
  groupId: string
  visible: boolean
}

/** Panel admin: habilitar/deshabilitar la visibilidad de tablas para usuarios sin acceso — ver specs/tabla-pickem-semanal. */
export function setPickemTablesVisibility(
  deps: SetPickemTablesVisibilityDeps,
  params: SetPickemTablesVisibilityParams,
): Promise<void> {
  return deps.pickemStandingsRepository.setTablesVisibleToAll(params.groupId, params.visible)
}
