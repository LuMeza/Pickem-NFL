import type { WeeklyAccessRepository, WeeklyAccessRequest } from '@/core/ports/WeeklyAccessRepository'

export interface ListWeeklyAccessRequestsDeps {
  weeklyAccessRepository: WeeklyAccessRepository
}

export interface ListWeeklyAccessRequestsParams {
  groupId: string
}

/** Panel admin: solicitudes de acceso semanal de un grupo — ver specs/acceso-semanal-pickem. */
export function listWeeklyAccessRequests(
  deps: ListWeeklyAccessRequestsDeps,
  params: ListWeeklyAccessRequestsParams,
): Promise<WeeklyAccessRequest[]> {
  return deps.weeklyAccessRepository.listRequests(params.groupId)
}
