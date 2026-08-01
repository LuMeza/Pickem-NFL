import type { PickemStandingsRepository } from '@/core/ports/PickemStandingsRepository'
import type { StandingRow } from '@/core/entities/standings'

export interface ListSeasonStandingsDeps {
  pickemStandingsRepository: PickemStandingsRepository
}

export interface ListSeasonStandingsParams {
  groupId: string
}

/** Tabla acumulada de temporada — ver specs/tabla-pickem-semanal. */
export function listSeasonStandings(
  deps: ListSeasonStandingsDeps,
  params: ListSeasonStandingsParams,
): Promise<StandingRow[]> {
  return deps.pickemStandingsRepository.listSeasonStandings(params.groupId)
}
