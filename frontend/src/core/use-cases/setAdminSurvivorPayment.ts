import type { AdminPaymentsRepository } from '@/core/ports/AdminPaymentsRepository'
import type { SurvivorLife } from '@/core/entities/survivor'

export interface SetAdminSurvivorPaymentDeps {
  adminPaymentsRepository: AdminPaymentsRepository
}

export interface SetAdminSurvivorPaymentParams {
  groupId: string
  userId: string
  lifeNumber: SurvivorLife
  paid: boolean
}

/** Panel admin: marca o desmarca el pago de una vida de Survivor de un usuario. */
export function setAdminSurvivorPayment(
  deps: SetAdminSurvivorPaymentDeps,
  params: SetAdminSurvivorPaymentParams,
): Promise<void> {
  return deps.adminPaymentsRepository.setSurvivorPayment(
    params.groupId,
    params.userId,
    params.lifeNumber,
    params.paid,
  )
}
