import type { SupabaseClient } from '@supabase/supabase-js'
import type { SaveWeeklyPickParams, WeeklyPickRepository, WeeklyPickValue } from '@/core/ports/WeeklyPickRepository'

export class SupabaseWeeklyPickRepository implements WeeklyPickRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async listPicksForWeek(userId: string, weekId: string): Promise<Record<string, WeeklyPickValue>> {
    const { data, error } = await this.client
      .from('weekly_picks')
      .select('game_id, pick, games!inner(week_id)')
      .eq('user_id', userId)
      .eq('games.week_id', weekId)
    if (error) throw error

    const picks: Record<string, WeeklyPickValue> = {}
    for (const row of data ?? []) {
      picks[row.game_id as string] = row.pick as WeeklyPickValue
    }
    return picks
  }

  async savePick(params: SaveWeeklyPickParams): Promise<void> {
    const { error } = await this.client.from('weekly_picks').upsert(
      {
        group_id: params.groupId,
        user_id: params.userId,
        game_id: params.gameId,
        pick: params.pick,
      },
      { onConflict: 'user_id,game_id' },
    )
    if (error) throw error
  }
}
