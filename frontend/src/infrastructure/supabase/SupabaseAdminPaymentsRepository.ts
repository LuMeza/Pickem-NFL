import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AdminPaymentsRepository,
  AdminSurvivorPaymentRow,
  AdminSurvivorWithdrawalRow,
  AdminWeeklyPaymentRow,
} from '@/core/ports/AdminPaymentsRepository'
import type { SurvivorLife } from '@/core/entities/survivor'

interface WeeklyPaymentRow {
  user_id: string
  paid: boolean
}

interface SurvivorPaymentRow {
  user_id: string
  life_number: number
  paid: boolean
}

interface SurvivorWithdrawalRow {
  user_id: string
  withdrawn: boolean
}

export class SupabaseAdminPaymentsRepository implements AdminPaymentsRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async listWeeklyPayments(groupId: string, weekId: string): Promise<AdminWeeklyPaymentRow[]> {
    const { data, error } = await this.client
      .from('weekly_payments')
      .select('user_id, paid')
      .eq('group_id', groupId)
      .eq('week_id', weekId)
    if (error) throw error

    return ((data ?? []) as WeeklyPaymentRow[]).map((row) => ({
      userId: row.user_id,
      paid: row.paid,
    }))
  }

  async setWeeklyPayment(groupId: string, weekId: string, userId: string, paid: boolean): Promise<void> {
    const { error } = await this.client
      .from('weekly_payments')
      .upsert(
        { group_id: groupId, week_id: weekId, user_id: userId, paid },
        { onConflict: 'group_id,user_id,week_id' },
      )
    if (error) throw error
  }

  async listSurvivorPayments(groupId: string): Promise<AdminSurvivorPaymentRow[]> {
    const { data, error } = await this.client
      .from('survivor_payments')
      .select('user_id, life_number, paid')
      .eq('group_id', groupId)
    if (error) throw error

    return ((data ?? []) as SurvivorPaymentRow[]).map((row) => ({
      userId: row.user_id,
      lifeNumber: row.life_number as SurvivorLife,
      paid: row.paid,
    }))
  }

  async setSurvivorPayment(groupId: string, userId: string, lifeNumber: SurvivorLife, paid: boolean): Promise<void> {
    const { error } = await this.client
      .from('survivor_payments')
      .upsert(
        { group_id: groupId, user_id: userId, life_number: lifeNumber, paid },
        { onConflict: 'group_id,user_id,life_number' },
      )
    if (error) throw error
  }

  async listSurvivorWithdrawals(groupId: string): Promise<AdminSurvivorWithdrawalRow[]> {
    const { data, error } = await this.client
      .from('survivor_withdrawals')
      .select('user_id, withdrawn')
      .eq('group_id', groupId)
    if (error) throw error

    return ((data ?? []) as SurvivorWithdrawalRow[]).map((row) => ({
      userId: row.user_id,
      withdrawn: row.withdrawn,
    }))
  }

  async setSurvivorWithdrawal(groupId: string, userId: string, withdrawn: boolean): Promise<void> {
    const { error } = await this.client
      .from('survivor_withdrawals')
      .upsert({ group_id: groupId, user_id: userId, withdrawn }, { onConflict: 'group_id,user_id' })
    if (error) throw error
  }
}
