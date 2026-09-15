import type { AdminPaymentsRepository, AdminSurvivorWithdrawalRow } from '@/core/ports/AdminPaymentsRepository'

export interface ListAdminSurvivorWithdrawalsDeps {
  adminPaymentsRepository: AdminPaymentsRepository
}

export interface ListAdminSurvivorWithdrawalsParams {
  groupId: string
}

/** Panel admin: quienes fueron retirados del pool de Survivor (no pagaron) en todo el grupo. */
export function listAdminSurvivorWithdrawals(
  deps: ListAdminSurvivorWithdrawalsDeps,
  params: ListAdminSurvivorWithdrawalsParams,
): Promise<AdminSurvivorWithdrawalRow[]> {
  return deps.adminPaymentsRepository.listSurvivorWithdrawals(params.groupId)
}
