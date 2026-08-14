import type { SupabaseClient } from '@supabase/supabase-js'
import type { PickemStandingsRepository } from '@/core/ports/PickemStandingsRepository'
import type { StandingRow } from '@/core/entities/standings'

interface StandingRowResponse {
  user_id: string
  display_name: string
  correct_count?: number
  total_correct?: number
  current_streak?: number
}

function toStandingRows(rows: StandingRowResponse[], countField: 'correct_count' | 'total_correct'): StandingRow[] {
  return rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    correctCount: Number(row[countField] ?? 0),
    currentStreak: Number(row.current_streak ?? 0),
  }))
}

export class SupabasePickemStandingsRepository implements PickemStandingsRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async canViewTables(groupId: string): Promise<boolean> {
    const { data, error } = await this.client.rpc('can_view_pickem_tables_for_group', { p_group_id: groupId })
    if (error) throw error
    return Boolean(data)
  }

  async listWeeklyStandings(groupId: string, weekId: string): Promise<StandingRow[]> {
    const { data, error } = await this.client.rpc('pickem_weekly_standings', {
      p_group_id: groupId,
      p_week_id: weekId,
    })
    if (error) throw error
    return toStandingRows((data ?? []) as StandingRowResponse[], 'correct_count')
  }

  async listSeasonStandings(groupId: string): Promise<StandingRow[]> {
    const { data, error } = await this.client.rpc('pickem_season_standings', { p_group_id: groupId })
    if (error) throw error
    return toStandingRows((data ?? []) as StandingRowResponse[], 'total_correct')
  }

  async getTablesVisibleToAll(groupId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('pickem_settings')
      .select('tables_visible_to_all')
      .eq('group_id', groupId)
      .maybeSingle()
    if (error) throw error
    return Boolean(data?.tables_visible_to_all)
  }

  async setTablesVisibleToAll(groupId: string, visible: boolean): Promise<void> {
    const { error } = await this.client
      .from('pickem_settings')
      .upsert({ group_id: groupId, tables_visible_to_all: visible })
    if (error) throw error
  }
}
