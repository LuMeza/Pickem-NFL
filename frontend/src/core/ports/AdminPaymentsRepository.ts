import type { SurvivorLife } from '@/core/entities/survivor'

export interface AdminWeeklyPaymentRow {
  userId: string
  paid: boolean
}

export interface AdminSurvivorPaymentRow {
  userId: string
  lifeNumber: SurvivorLife
  paid: boolean
}

export interface AdminSurvivorWithdrawalRow {
  userId: string
  withdrawn: boolean
}

/**
 * Panel admin: seguimiento de que usuarios ya pagaron la apuesta del pickem
 * semanal (una fila por semana) y las vidas de Survivor (una fila por vida --
 * la 1 al entrar, la 2 y la 3 solo si se pidieron y se aprobaron), mas el
 * retiro de jugadores de Survivor que no pagaron (ver
 * supabase/migrations/20260915000001_survivor_withdrawals.sql). A diferencia
 * de AdminPicksRepository no hace falta pasar por funciones security
 * definer: estas tablas son admin-only por RLS, asi que se leen y escriben
 * directo.
 */
export interface AdminPaymentsRepository {
  listWeeklyPayments(groupId: string, weekId: string): Promise<AdminWeeklyPaymentRow[]>
  setWeeklyPayment(groupId: string, weekId: string, userId: string, paid: boolean): Promise<void>
  listSurvivorPayments(groupId: string): Promise<AdminSurvivorPaymentRow[]>
  setSurvivorPayment(groupId: string, userId: string, lifeNumber: SurvivorLife, paid: boolean): Promise<void>
  listSurvivorWithdrawals(groupId: string): Promise<AdminSurvivorWithdrawalRow[]>
  setSurvivorWithdrawal(groupId: string, userId: string, withdrawn: boolean): Promise<void>
}
