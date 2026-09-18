import type { AdminPaymentsRepository } from '@/core/ports/AdminPaymentsRepository'

export interface GrantSurvivorPickExceptionDeps {
  adminPaymentsRepository: AdminPaymentsRepository
}

export interface GrantSurvivorPickExceptionParams {
  groupId: string
  userId: string
  weekId: string
}

/** Panel admin: habilita el pick de Survivor de una semana ya cerrada para un usuario puntual. */
export function grantSurvivorPickException(
  deps: GrantSurvivorPickExceptionDeps,
  params: GrantSurvivorPickExceptionParams,
): Promise<void> {
  return deps.adminPaymentsRepository.grantSurvivorPickException(params.groupId, params.userId, params.weekId)
}
