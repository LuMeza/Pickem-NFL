import type { AdminPaymentsRepository } from '@/core/ports/AdminPaymentsRepository'

export interface SetAdminWeeklyPaymentDeps {
  adminPaymentsRepository: AdminPaymentsRepository
}

export interface SetAdminWeeklyPaymentParams {
  groupId: string
  weekId: string
  userId: string
  paid: boolean
}

/** Panel admin: marca o desmarca el pago de la apuesta semanal de un usuario, para una semana. */
export function setAdminWeeklyPayment(
  deps: SetAdminWeeklyPaymentDeps,
  params: SetAdminWeeklyPaymentParams,
): Promise<void> {
  return deps.adminPaymentsRepository.setWeeklyPayment(params.groupId, params.weekId, params.userId, params.paid)
}
