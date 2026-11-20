import type { PlayoffPickValue, PlayoffsRepository } from '@/core/ports/PlayoffsRepository'

export interface ListPlayoffPicksForWeekDeps {
  playoffsRepository: PlayoffsRepository
}

export interface ListPlayoffPicksForWeekParams {
  userId: string
  weekId: string
}

/** Picks propios de una ronda de playoffs — ver specs/prediccion-playoffs. */
export function listPlayoffPicksForWeek(
  deps: ListPlayoffPicksForWeekDeps,
  params: ListPlayoffPicksForWeekParams,
): Promise<Record<string, PlayoffPickValue>> {
  return deps.playoffsRepository.listPicksForWeek(params.userId, params.weekId)
}
