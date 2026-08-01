import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  WeeklyAccessRepository,
  WeeklyAccessRequest,
  WeeklyAccessStatus,
} from '@/core/ports/WeeklyAccessRepository'

export class SupabaseWeeklyAccessRepository implements WeeklyAccessRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async requestAccess(groupId: string, userId: string, weekId: string): Promise<void> {
    const { error } = await this.client
      .from('weekly_access')
      .upsert({ group_id: groupId, user_id: userId, week_id: weekId, status: 'solicitado' })
    if (error) throw error
  }

  async approveAccess(groupId: string, userId: string, weekId: string): Promise<void> {
    await this.setStatus(groupId, userId, weekId, 'aprobado')
  }

  async rejectAccess(groupId: string, userId: string, weekId: string): Promise<void> {
    await this.setStatus(groupId, userId, weekId, 'rechazado')
  }

  async getAccessStatus(groupId: string, userId: string, weekId: string): Promise<WeeklyAccessStatus | null> {
    const { data, error } = await this.client
      .from('weekly_access')
      .select('status')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('week_id', weekId)
      .maybeSingle()
    if (error) throw error

    return (data?.status as WeeklyAccessStatus | undefined) ?? null
  }

  async listRequests(groupId: string): Promise<WeeklyAccessRequest[]> {
    const { data, error } = await this.client
      .from('weekly_access')
      .select('user_id, week_id, status, profiles(display_name)')
      .eq('group_id', groupId)
      .order('requested_at')
    if (error) throw error

    return (data ?? []).map((row) => {
      const profile = row.profiles as unknown as { display_name: string } | { display_name: string }[] | null
      const displayName = Array.isArray(profile) ? profile[0]?.display_name : profile?.display_name

      return {
        userId: row.user_id as string,
        displayName: displayName ?? '',
        weekId: row.week_id as string,
        status: row.status as WeeklyAccessStatus,
      }
    })
  }

  private async setStatus(
    groupId: string,
    userId: string,
    weekId: string,
    status: WeeklyAccessStatus,
  ): Promise<void> {
    const { error } = await this.client
      .from('weekly_access')
      .update({ status })
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('week_id', weekId)
    if (error) throw error
  }
}
