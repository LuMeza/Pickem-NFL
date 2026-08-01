import type { AdminPicksRepository, AdminWeeklyPickRow } from '@/core/ports/AdminPicksRepository'

export interface ListAdminWeeklyPicksForWeekDeps {
  adminPicksRepository: AdminPicksRepository
}

export interface ListAdminWeeklyPicksForWeekParams {
  groupId: string
  weekId: string
}

/** Panel admin: picks de todos los usuarios del grupo en pickem semanal, para una semana. */
export function listAdminWeeklyPicksForWeek(
  deps: ListAdminWeeklyPicksForWeekDeps,
  params: ListAdminWeeklyPicksForWeekParams,
): Promise<AdminWeeklyPickRow[]> {
  return deps.adminPicksRepository.listWeeklyPicksForWeek(params.groupId, params.weekId)
}
