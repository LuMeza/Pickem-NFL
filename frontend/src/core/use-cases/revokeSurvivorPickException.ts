import type { AdminPaymentsRepository } from '@/core/ports/AdminPaymentsRepository'

export interface RevokeSurvivorPickExceptionDeps {
  adminPaymentsRepository: AdminPaymentsRepository
}

export interface RevokeSurvivorPickExceptionParams {
  groupId: string
  userId: string
  weekId: string
}

/** Panel admin: revoca un acceso excepcional de pick de Survivor que el usuario todavía no usó. */
export function revokeSurvivorPickException(
  deps: RevokeSurvivorPickExceptionDeps,
  params: RevokeSurvivorPickExceptionParams,
): Promise<void> {
  return deps.adminPaymentsRepository.revokeSurvivorPickException(params.groupId, params.userId, params.weekId)
}
