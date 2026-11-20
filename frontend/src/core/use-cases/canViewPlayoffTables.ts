import type { PlayoffsRepository } from '@/core/ports/PlayoffsRepository'

export interface CanViewPlayoffTablesDeps {
  playoffsRepository: PlayoffsRepository
}

export interface CanViewPlayoffTablesParams {
  groupId: string
}

/** Visibilidad de las tablas de playoffs — ver specs/tabla-playoffs. */
export function canViewPlayoffTables(
  deps: CanViewPlayoffTablesDeps,
  params: CanViewPlayoffTablesParams,
): Promise<boolean> {
  return deps.playoffsRepository.canViewTables(params.groupId)
}
