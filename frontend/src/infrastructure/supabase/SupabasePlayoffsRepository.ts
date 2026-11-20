import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  PlayoffPickValue,
  PlayoffsRepository,
  PlayoffStandingRow,
  SavePlayoffPickParams,
} from '@/core/ports/PlayoffsRepository'

interface PlayoffStandingResponse {
  user_id: string
  display_name: string
  correct_count?: number
  total_correct?: number
}

function toRows(rows: PlayoffStandingResponse[], countField: 'correct_count' | 'total_correct'): PlayoffStandingRow[] {
  return rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    correctCount: Number(row[countField] ?? 0),
  }))
}

export class SupabasePlayoffsRepository implements PlayoffsRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async listPicksForWeek(userId: string, weekId: string): Promise<Record<string, PlayoffPickValue>> {
    const { data, error } = await this.client
      .from('playoff_picks')
      .select('game_id, pick, games!inner(week_id)')
      .eq('user_id', userId)
      .eq('games.week_id', weekId)
    if (error) throw error

    const picks: Record<string, PlayoffPickValue> = {}
    for (const row of data ?? []) {
      picks[row.game_id as string] = row.pick as PlayoffPickValue
    }
    return picks
  }

  async savePick(params: SavePlayoffPickParams): Promise<void> {
    const { error } = await this.client.from('playoff_picks').upsert(
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

  async canViewTables(groupId: string): Promise<boolean> {
    const { data, error } = await this.client.rpc('can_view_playoff_tables_for_group', { p_group_id: groupId })
    if (error) throw error
    return Boolean(data)
  }

  async listRoundStandings(groupId: string, weekId: string): Promise<PlayoffStandingRow[]> {
    const { data, error } = await this.client.rpc('playoff_round_standings', {
      p_group_id: groupId,
      p_week_id: weekId,
    })
    if (error) throw error
    return toRows((data ?? []) as PlayoffStandingResponse[], 'correct_count')
  }

  async listFinalStandings(groupId: string): Promise<PlayoffStandingRow[]> {
    const { data, error } = await this.client.rpc('playoff_final_standings', { p_group_id: groupId })
    if (error) throw error
    return toRows((data ?? []) as PlayoffStandingResponse[], 'total_correct')
  }
}
