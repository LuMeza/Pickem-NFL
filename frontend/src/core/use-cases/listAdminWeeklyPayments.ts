import type { AdminPaymentsRepository, AdminWeeklyPaymentRow } from '@/core/ports/AdminPaymentsRepository'

export interface ListAdminWeeklyPaymentsDeps {
  adminPaymentsRepository: AdminPaymentsRepository
}

export interface ListAdminWeeklyPaymentsParams {
  groupId: string
  weekId: string
}

/** Panel admin: quien ya pago la apuesta del pickem semanal, para una semana. */
export function listAdminWeeklyPayments(
  deps: ListAdminWeeklyPaymentsDeps,
  params: ListAdminWeeklyPaymentsParams,
): Promise<AdminWeeklyPaymentRow[]> {
  return deps.adminPaymentsRepository.listWeeklyPayments(params.groupId, params.weekId)
}
