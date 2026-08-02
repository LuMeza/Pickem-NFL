import type { WeeklyAccessRepository } from '@/core/ports/WeeklyAccessRepository'

export interface ResolveWeeklyAccessRequestDeps {
  weeklyAccessRepository: WeeklyAccessRepository
}

export interface ResolveWeeklyAccessRequestParams {
  groupId: string
  userId: string
  weekId: string
  decision: 'aprobado' | 'rechazado'
}

/** Aprobación/rechazo de acceso semanal por el administrador — ver specs/acceso-semanal-pickem. */
export function resolveWeeklyAccessRequest(
  deps: ResolveWeeklyAccessRequestDeps,
  params: ResolveWeeklyAccessRequestParams,
): Promise<void> {
  return params.decision === 'aprobado'
    ? deps.weeklyAccessRepository.approveAccess(params.groupId, params.userId, params.weekId)
    : deps.weeklyAccessRepository.rejectAccess(params.groupId, params.userId, params.weekId)
}
