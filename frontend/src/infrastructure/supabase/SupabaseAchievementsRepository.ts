import type { SupabaseClient } from '@supabase/supabase-js'
import type { AchievementsRepository } from '@/core/ports/AchievementsRepository'
import type {
  Achievement,
  AchievementScope,
  ProfilePickemSummary,
  ProfileWeeklyTrendPoint,
  UnlockedAchievement,
} from '@/core/entities/achievement'

interface AchievementRow {
  id: string
  scope: AchievementScope
  title: string
  description: string
}

interface ProfilePickemSummaryRow {
  total_correct: number | string
  total_picked: number | string
  total_picks_made: number | string
}

interface SeasonPickRow {
  pick: string
  games: {
    outcome: string | null
    weeks: { sort_order: number; type: ProfileWeeklyTrendPoint['weekType'] | 'hof'; number: number }
  }
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

  async listUnlockedAchievements(userId: string): Promise<UnlockedAchievement[]> {
    const { data, error } = await this.client
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId)
    if (error) throw error
    return (data ?? []).map((row: { achievement_id: string; unlocked_at: string }) => ({
      achievementId: row.achievement_id,
      unlockedAt: new Date(row.unlocked_at),
    }))
  }

  async getProfilePickemSummary(userId: string): Promise<ProfilePickemSummary> {
    const { data, error } = await this.client.rpc('profile_pickem_summary', { p_user_id: userId })
    if (error) throw error
    const row = (data?.[0] ?? { total_correct: 0, total_picked: 0, total_picks_made: 0 }) as ProfilePickemSummaryRow
    return {
      totalCorrect: Number(row.total_correct),
      totalPicked: Number(row.total_picked),
      totalPicksMade: Number(row.total_picks_made),
    }
  }

  /**
   * Se arma en cliente desde los picks propios (RLS: cada quien lee los
   * suyos) en vez de la RPC profile_pickem_weekly_trend, que corta a las
   * últimas 6 semanas — el riel de temporada del perfil necesita todas.
   * Mismo criterio que la RPC: solo semanas con al menos un resultado.
   */
  async getProfileWeeklyTrend(userId: string): Promise<ProfileWeeklyTrendPoint[]> {
    const { data, error } = await this.client
      .from('weekly_picks')
      .select('pick, games!inner(outcome, weeks!inner(sort_order, type, number))')
      .eq('user_id', userId)
    if (error) throw error

    const byWeek = new Map<number, ProfileWeeklyTrendPoint>()
    for (const row of (data ?? []) as unknown as SeasonPickRow[]) {
      const week = row.games.weeks
      if (week.type === 'hof' || row.games.outcome === null) continue
      const point = byWeek.get(week.sort_order) ?? {
        weekSortOrder: week.sort_order,
        weekType: week.type,
        weekNumber: week.number,
        totalCorrect: 0,
        totalPicked: 0,
      }
      point.totalPicked += 1
      if (row.pick === row.games.outcome) point.totalCorrect += 1
      byWeek.set(week.sort_order, point)
    }
    return [...byWeek.values()].sort((a, b) => a.weekSortOrder - b.weekSortOrder)
  }
}
