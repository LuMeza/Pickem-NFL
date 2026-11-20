import type { PlayoffsRepository, PlayoffStandingRow } from '@/core/ports/PlayoffsRepository'

export interface ListPlayoffFinalStandingsDeps {
  playoffsRepository: PlayoffsRepository
}

export interface ListPlayoffFinalStandingsParams {
  groupId: string
}

/** Ranking final acumulado de playoffs — ver specs/tabla-playoffs. */
export function listPlayoffFinalStandings(
  deps: ListPlayoffFinalStandingsDeps,
  params: ListPlayoffFinalStandingsParams,
): Promise<PlayoffStandingRow[]> {
  return deps.playoffsRepository.listFinalStandings(params.groupId)
}
