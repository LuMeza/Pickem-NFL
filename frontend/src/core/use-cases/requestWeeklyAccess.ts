import type { WeeklyAccessRepository } from '@/core/ports/WeeklyAccessRepository'

export interface RequestWeeklyAccessDeps {
  weeklyAccessRepository: WeeklyAccessRepository
}

export interface RequestWeeklyAccessParams {
  groupId: string
  userId: string
  weekId: string
}

/** Solicitud de acceso al pickem de una semana puntual — ver specs/acceso-semanal-pickem. */
export function requestWeeklyAccess(
  deps: RequestWeeklyAccessDeps,
  params: RequestWeeklyAccessParams,
): Promise<void> {
  return deps.weeklyAccessRepository.requestAccess(params.groupId, params.userId, params.weekId)
}
