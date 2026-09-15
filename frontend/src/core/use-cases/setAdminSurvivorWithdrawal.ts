import type { AdminPaymentsRepository } from '@/core/ports/AdminPaymentsRepository'
import type { SurvivorRepository } from '@/core/ports/SurvivorRepository'

export interface SetAdminSurvivorWithdrawalDeps {
  adminPaymentsRepository: AdminPaymentsRepository
  survivorRepository: SurvivorRepository
}

export interface SetAdminSurvivorWithdrawalParams {
  groupId: string
  userId: string
  withdrawn: boolean
}

/**
 * Panel admin: retira (o reincorpora) a un usuario del pool de Survivor —
 * quien no pago, por ejemplo. Tras guardar el retiro hace falta recalcular
 * el estado (ver _survivor_recompute en
 * supabase/migrations/20260915000001_survivor_withdrawals.sql) para que la
 * fila del usuario salga de survivor_state ya mismo, en vez de esperar al
 * proximo resultado cargado.
 */
export async function setAdminSurvivorWithdrawal(
  deps: SetAdminSurvivorWithdrawalDeps,
  params: SetAdminSurvivorWithdrawalParams,
): Promise<void> {
  await deps.adminPaymentsRepository.setSurvivorWithdrawal(params.groupId, params.userId, params.withdrawn)
  await deps.survivorRepository.recalculate(params.groupId)
}
