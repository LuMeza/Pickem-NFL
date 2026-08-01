import type { WeeklyAccessRepository, WeeklyAccessStatus } from '@/core/ports/WeeklyAccessRepository'

export interface GetWeeklyAccessStatusDeps {
  weeklyAccessRepository: WeeklyAccessRepository
}

export interface GetWeeklyAccessStatusParams {
  groupId: string
  userId: string
  weekId: string
}

/** Estado de acceso propio al pickem de una semana — ver specs/acceso-semanal-pickem. */
export function getWeeklyAccessStatus(
  deps: GetWeeklyAccessStatusDeps,
  params: GetWeeklyAccessStatusParams,
): Promise<WeeklyAccessStatus | null> {
  return deps.weeklyAccessRepository.getAccessStatus(params.groupId, params.userId, params.weekId)
}
