import type { SupabaseClient } from '@supabase/supabase-js'
import type { Game, Team, Week, WeekType } from '@/core/entities/catalog'
import type { CatalogRepository } from '@/core/ports/CatalogRepository'

export class SupabaseCatalogRepository implements CatalogRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async listTeams(): Promise<Team[]> {
    const { data, error } = await this.client.from('teams').select('id, name').order('name')
    if (error) throw error

    return (data ?? []).map((row) => ({ id: row.id as string, name: row.name as string }))
  }

  async listWeeks(): Promise<Week[]> {
    const { data, error } = await this.client.from('weeks').select('id, type, number').order('sort_order')
    if (error) throw error

    return (data ?? []).map((row) => ({
      id: row.id as string,
      type: row.type as WeekType,
      number: row.number as number,
    }))
  }

  async listGamesForWeek(weekId: string): Promise<Game[]> {
    const { data, error } = await this.client
      .from('games')
      .select('id, week_id, home_team_id, away_team_id, kickoff_at')
      .eq('week_id', weekId)
      .order('kickoff_at')
    if (error) throw error

    return (data ?? []).map((row) => ({
      id: row.id as string,
      weekId: row.week_id as string,
      homeTeamId: row.home_team_id as string,
      awayTeamId: row.away_team_id as string,
      kickoffAt: new Date(row.kickoff_at as string),
    }))
  }
}
