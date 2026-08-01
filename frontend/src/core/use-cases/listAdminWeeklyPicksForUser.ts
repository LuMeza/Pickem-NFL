import type { AdminPicksRepository, AdminUserWeeklyPick } from '@/core/ports/AdminPicksRepository'

export interface ListAdminWeeklyPicksForUserDeps {
  adminPicksRepository: AdminPicksRepository
}

export interface ListAdminWeeklyPicksForUserParams {
  groupId: string
  userId: string
}

/** Panel admin: historico completo de picks de pickem semanal de un usuario. */
export function listAdminWeeklyPicksForUser(
  deps: ListAdminWeeklyPicksForUserDeps,
  params: ListAdminWeeklyPicksForUserParams,
): Promise<AdminUserWeeklyPick[]> {
  return deps.adminPicksRepository.listWeeklyPicksForUser(params.groupId, params.userId)
}
