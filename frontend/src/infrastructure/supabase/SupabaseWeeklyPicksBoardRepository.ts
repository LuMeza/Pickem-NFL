import type { SupabaseClient } from '@supabase/supabase-js'
import type { WeeklyPickBoardRow, WeeklyPicksBoardRepository } from '@/core/ports/WeeklyPicksBoardRepository'

interface BoardForWeekRow {
  user_id: string
  display_name: string
  game_id: string
  pick: string | null
  outcome: string | null
}

export class SupabaseWeeklyPicksBoardRepository implements WeeklyPicksBoardRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async listPicksForWeek(groupId: string, weekId: string): Promise<WeeklyPickBoardRow[]> {
    const { data, error } = await this.client.rpc('weekly_picks_board_for_week', {
      p_group_id: groupId,
      p_week_id: weekId,
    })
    if (error) throw error

    return ((data ?? []) as BoardForWeekRow[]).map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      gameId: row.game_id,
      pick: row.pick as WeeklyPickBoardRow['pick'],
      outcome: row.outcome as WeeklyPickBoardRow['outcome'],
    }))
  }
}
