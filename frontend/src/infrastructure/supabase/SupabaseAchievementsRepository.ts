import type { SupabaseClient } from '@supabase/supabase-js'
import type { AchievementsRepository } from '@/core/ports/AchievementsRepository'
import type { Achievement, AchievementScope, ProfilePickemSummary } from '@/core/entities/achievement'

interface AchievementRow {
  id: string
  scope: AchievementScope
  title: string
  description: string
}

interface ProfilePickemSummaryRow {
  total_correct: number | string
  total_picked: number | string
}

export class SupabaseAchievementsRepository implements AchievementsRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async listCatalog(): Promise<Achievement[]> {
    const { data, error } = await this.client
      .from('achievements')
      .select('id, scope, title, description')
      .order('scope')
    if (error) throw error
    return (data ?? []).map((row: AchievementRow) => ({
      id: row.id,
      scope: row.scope,
      title: row.title,
      description: row.description,
    }))
  }

  async listMyUnlockedAchievementIds(): Promise<string[]> {
    const { data, error } = await this.client.from('user_achievements').select('achievement_id')
    if (error) throw error
    return (data ?? []).map((row: { achievement_id: string }) => row.achievement_id)
  }

  async syncMyAchievements(): Promise<void> {
    const { error } = await this.client.rpc('sync_my_achievements')
    if (error) throw error
  }

  async getProfilePickemSummary(userId: string): Promise<ProfilePickemSummary> {
    const { data, error } = await this.client.rpc('profile_pickem_summary', { p_user_id: userId })
    if (error) throw error
    const row = (data?.[0] ?? { total_correct: 0, total_picked: 0 }) as ProfilePickemSummaryRow
    return { totalCorrect: Number(row.total_correct), totalPicked: Number(row.total_picked) }
  }
}
