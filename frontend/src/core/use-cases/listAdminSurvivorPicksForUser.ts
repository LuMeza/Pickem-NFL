import type { AdminPicksRepository, AdminUserSurvivorPick } from '@/core/ports/AdminPicksRepository'

export interface ListAdminSurvivorPicksForUserDeps {
  adminPicksRepository: AdminPicksRepository
}

export interface ListAdminSurvivorPicksForUserParams {
  groupId: string
  userId: string
}

/** Panel admin: historico completo de picks de survivor de un usuario. */
export function listAdminSurvivorPicksForUser(
  deps: ListAdminSurvivorPicksForUserDeps,
  params: ListAdminSurvivorPicksForUserParams,
): Promise<AdminUserSurvivorPick[]> {
  return deps.adminPicksRepository.listSurvivorPicksForUser(params.groupId, params.userId)
}
