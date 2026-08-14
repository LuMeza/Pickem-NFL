import type { WeeklyPickBoardRow, WeeklyPicksBoardRepository } from '@/core/ports/WeeklyPicksBoardRepository'

export interface ListWeeklyPicksBoardDeps {
  weeklyPicksBoardRepository: WeeklyPicksBoardRepository
}

export interface ListWeeklyPicksBoardParams {
  groupId: string
  weekId: string
}

/** Picks de todos los usuarios del grupo en pickem semanal, para una semana ya bloqueada. */
export function listWeeklyPicksBoard(
  deps: ListWeeklyPicksBoardDeps,
  params: ListWeeklyPicksBoardParams,
): Promise<WeeklyPickBoardRow[]> {
  return deps.weeklyPicksBoardRepository.listPicksForWeek(params.groupId, params.weekId)
}
