import type { AdminPicksRepository, AdminSurvivorPickRow } from '@/core/ports/AdminPicksRepository'

export interface ListAdminSurvivorPicksForWeekDeps {
  adminPicksRepository: AdminPicksRepository
}

export interface ListAdminSurvivorPicksForWeekParams {
  groupId: string
  weekId: string
}

/** Panel admin: picks de todos los usuarios del grupo en survivor, para una semana. */
export function listAdminSurvivorPicksForWeek(
  deps: ListAdminSurvivorPicksForWeekDeps,
  params: ListAdminSurvivorPicksForWeekParams,
): Promise<AdminSurvivorPickRow[]> {
  return deps.adminPicksRepository.listSurvivorPicksForWeek(params.groupId, params.weekId)
}
