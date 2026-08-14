import type { RealtimePostgresUpdatePayload, SupabaseClient } from '@supabase/supabase-js'
import type { Game, Player, Team, Week, WeekType } from '@/core/entities/catalog'
import type { CatalogRepository, GameChanges, NewGame } from '@/core/ports/CatalogRepository'

interface GameOutcomeRow {
  outcome: string | null
}

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
      .select('id, week_id, home_team_id, away_team_id, kickoff_at, live_period, live_clock')
      .eq('week_id', weekId)
      .order('kickoff_at')
    if (error) throw error

    return (data ?? []).map((row) => ({
      id: row.id as string,
      weekId: row.week_id as string,
      homeTeamId: row.home_team_id as string,
      awayTeamId: row.away_team_id as string,
      kickoffAt: new Date(row.kickoff_at as string),
      livePeriod: row.live_period as number | null,
      liveClock: row.live_clock as string | null,
    }))
  }

  async listAllGames(): Promise<Game[]> {
    const { data, error } = await this.client
      .from('games')
      .select('id, week_id, home_team_id, away_team_id, kickoff_at, live_period, live_clock')
      .order('kickoff_at')
    if (error) throw error

    return (data ?? []).map((row) => ({
      id: row.id as string,
      weekId: row.week_id as string,
      homeTeamId: row.home_team_id as string,
      awayTeamId: row.away_team_id as string,
      kickoffAt: new Date(row.kickoff_at as string),
      livePeriod: row.live_period as number | null,
      liveClock: row.live_clock as string | null,
    }))
  }

  async listGamesForTeam(teamId: string): Promise<Game[]> {
    const { data, error } = await this.client
      .from('games')
      .select('id, week_id, home_team_id, away_team_id, kickoff_at, live_period, live_clock')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('kickoff_at')
    if (error) throw error

    return (data ?? []).map((row) => ({
      id: row.id as string,
      weekId: row.week_id as string,
      homeTeamId: row.home_team_id as string,
      awayTeamId: row.away_team_id as string,
      kickoffAt: new Date(row.kickoff_at as string),
      livePeriod: row.live_period as number | null,
      liveClock: row.live_clock as string | null,
    }))
  }

  async listPlayersForTeam(teamId: string): Promise<Player[]> {
    const { data, error } = await this.client
      .from('players')
      .select(
        'id, team_id, full_name, position, jersey_number, unit, height_in, weight_lbs, birth_date, age, college, experience_years, status, injury_status, injury_detail',
      )
      .eq('team_id', teamId)
      .order('unit')
      .order('full_name')
    if (error) throw error

    return (data ?? []).map((row) => ({
      id: row.id as string,
      teamId: row.team_id as string,
      fullName: row.full_name as string,
      position: row.position as string | null,
      jerseyNumber: row.jersey_number as string | null,
      unit: row.unit as string | null,
      heightIn: row.height_in as number | null,
      weightLbs: row.weight_lbs as number | null,
      birthDate: row.birth_date as string | null,
      age: row.age as number | null,
      college: row.college as string | null,
      experienceYears: row.experience_years as number | null,
      status: row.status as string | null,
      injuryStatus: row.injury_status as string | null,
      injuryDetail: row.injury_detail as string | null,
    }))
  }

  async createGame(game: NewGame): Promise<Game> {
    const { data, error } = await this.client
      .from('games')
      .insert({
        week_id: game.weekId,
        home_team_id: game.homeTeamId,
        away_team_id: game.awayTeamId,
        kickoff_at: game.kickoffAt.toISOString(),
      })
      .select('id, week_id, home_team_id, away_team_id, kickoff_at, live_period, live_clock')
      .single()
    if (error) throw error

    return {
      id: data.id as string,
      weekId: data.week_id as string,
      homeTeamId: data.home_team_id as string,
      awayTeamId: data.away_team_id as string,
      kickoffAt: new Date(data.kickoff_at as string),
      livePeriod: data.live_period as number | null,
      liveClock: data.live_clock as string | null,
    }
  }

  async updateGame(gameId: string, changes: GameChanges): Promise<Game> {
    const { data, error } = await this.client
      .from('games')
      .update({
        home_team_id: changes.homeTeamId,
        away_team_id: changes.awayTeamId,
        kickoff_at: changes.kickoffAt.toISOString(),
      })
      .eq('id', gameId)
      .select('id, week_id, home_team_id, away_team_id, kickoff_at, live_period, live_clock')
      .single()
    if (error) throw error

    return {
      id: data.id as string,
      weekId: data.week_id as string,
      homeTeamId: data.home_team_id as string,
      awayTeamId: data.away_team_id as string,
      kickoffAt: new Date(data.kickoff_at as string),
      livePeriod: data.live_period as number | null,
      liveClock: data.live_clock as string | null,
    }
  }

  subscribeToResultChanges(onChange: () => void): () => void {
    const channel = this.client
      .channel('games-results')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games' },
        (payload: RealtimePostgresUpdatePayload<GameOutcomeRow>) => {
          if (payload.new.outcome !== payload.old.outcome) onChange()
        },
      )
      .subscribe()

    return () => {
      void this.client.removeChannel(channel)
    }
  }
}
