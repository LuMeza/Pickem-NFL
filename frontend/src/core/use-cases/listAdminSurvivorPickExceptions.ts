import type { AdminPaymentsRepository, AdminSurvivorPickExceptionRow } from '@/core/ports/AdminPaymentsRepository'

export interface ListAdminSurvivorPickExceptionsDeps {
  adminPaymentsRepository: AdminPaymentsRepository
}

export interface ListAdminSurvivorPickExceptionsParams {
  groupId: string
  userId: string
}

/** Panel admin: semanas para las que un usuario puntual tiene un acceso excepcional de pick activo. */
export function listAdminSurvivorPickExceptions(
  deps: ListAdminSurvivorPickExceptionsDeps,
  params: ListAdminSurvivorPickExceptionsParams,
): Promise<AdminSurvivorPickExceptionRow[]> {
  return deps.adminPaymentsRepository.listSurvivorPickExceptions(params.groupId, params.userId)
}
