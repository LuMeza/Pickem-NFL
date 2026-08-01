import type { PickemStandingsRepository } from '@/core/ports/PickemStandingsRepository'

export interface CanViewPickemTablesDeps {
  pickemStandingsRepository: PickemStandingsRepository
}

export interface CanViewPickemTablesParams {
  groupId: string
}

/** Visibilidad de las tablas de posiciones — ver specs/tabla-pickem-semanal. */
export function canViewPickemTables(
  deps: CanViewPickemTablesDeps,
  params: CanViewPickemTablesParams,
): Promise<boolean> {
  return deps.pickemStandingsRepository.canViewTables(params.groupId)
}
