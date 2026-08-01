import type { WeeklyPickRepository, WeeklyPickValue } from '@/core/ports/WeeklyPickRepository'

export interface ListWeeklyPicksForWeekDeps {
  weeklyPickRepository: WeeklyPickRepository
}

export interface ListWeeklyPicksForWeekParams {
  userId: string
  weekId: string
}

/** Picks propios de una semana — ver specs/prediccion-pickem-semanal. */
export function listWeeklyPicksForWeek(
  deps: ListWeeklyPicksForWeekDeps,
  params: ListWeeklyPicksForWeekParams,
): Promise<Record<string, WeeklyPickValue>> {
  return deps.weeklyPickRepository.listPicksForWeek(params.userId, params.weekId)
}
