import type { PlayoffsRepository, PlayoffStandingRow } from '@/core/ports/PlayoffsRepository'

export interface ListPlayoffRoundStandingsDeps {
  playoffsRepository: PlayoffsRepository
}

export interface ListPlayoffRoundStandingsParams {
  groupId: string
  weekId: string
}

/** Tabla de resultados de una ronda de playoffs — ver specs/tabla-playoffs. */
export function listPlayoffRoundStandings(
  deps: ListPlayoffRoundStandingsDeps,
  params: ListPlayoffRoundStandingsParams,
): Promise<PlayoffStandingRow[]> {
  return deps.playoffsRepository.listRoundStandings(params.groupId, params.weekId)
}
