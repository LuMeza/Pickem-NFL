import type { WeeklyPicksBoardRepository, WeeklyPicksReadyCount } from '@/core/ports/WeeklyPicksBoardRepository'

export interface GetWeeklyPicksReadyCountDeps {
  weeklyPicksBoardRepository: WeeklyPicksBoardRepository
}

export interface GetWeeklyPicksReadyCountParams {
  groupId: string
  weekId: string
}

/** Cuántos jugadores del grupo ya hicieron picks en la semana (sin ver cuáles), para antes del cierre. */
export function getWeeklyPicksReadyCount(
  deps: GetWeeklyPicksReadyCountDeps,
  params: GetWeeklyPicksReadyCountParams,
): Promise<WeeklyPicksReadyCount> {
  return deps.weeklyPicksBoardRepository.getReadyCount(params.groupId, params.weekId)
}
