import type { AdminPaymentsRepository, AdminSurvivorPaymentRow } from '@/core/ports/AdminPaymentsRepository'

export interface ListAdminSurvivorPaymentsDeps {
  adminPaymentsRepository: AdminPaymentsRepository
}

export interface ListAdminSurvivorPaymentsParams {
  groupId: string
}

/** Panel admin: pago de cada vida de Survivor (1, 2 y 3) de todo el grupo. */
export function listAdminSurvivorPayments(
  deps: ListAdminSurvivorPaymentsDeps,
  params: ListAdminSurvivorPaymentsParams,
): Promise<AdminSurvivorPaymentRow[]> {
  return deps.adminPaymentsRepository.listSurvivorPayments(params.groupId)
}
