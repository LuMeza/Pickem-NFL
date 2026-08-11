import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SaveSurvivorPickParams,
  SurvivorLifeRequestDecision,
  SurvivorRepository,
} from '@/core/ports/SurvivorRepository'
import type {
  SurvivorLife,
  SurvivorLifeRequest,
  SurvivorParticipant,
  SurvivorPick,
  SurvivorStatus,
} from '@/core/entities/survivor'

interface SurvivorRosterRow {
  user_id: string
  display_name: string
  current_life: number
  status: string
  first_loss_week_id: string | null
  eliminated_week_id: string | null
  final_rank: number | null
}

export class SupabaseSurvivorRepository implements SurvivorRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async listMyPicks(groupId: string, userId: string): Promise<SurvivorPick[]> {
    const { data, error } = await this.client
      .from('survivor_picks')
      .select('week_id, team_id, life_number')
      .eq('group_id', groupId)
      .eq('user_id', userId)
    if (error) throw error

    return (data ?? []).map((row) => ({
      weekId: row.week_id as string,
      teamId: row.team_id as string,
      lifeNumber: row.life_number as SurvivorLife,
    }))
  }

  async savePick(params: SaveSurvivorPickParams): Promise<void> {
    const { error } = await this.client.from('survivor_picks').upsert(
      {
        group_id: params.groupId,
        user_id: params.userId,
        week_id: params.weekId,
        team_id: params.teamId,
      },
      { onConflict: 'user_id,group_id,week_id' },
    )
    if (error) throw error
  }

  async listGroupState(groupId: string): Promise<SurvivorParticipant[]> {
    // RPC en vez de leer group_members + survivor_state directo (ver
    // supabase/migrations/20260811000004_hide_test_accounts_from_standings.sql):
    // hace el join server-side y oculta las cuentas de prueba del dueño del
    // proyecto salvo que quien llama sea platform_admin.
    const { data, error } = await this.client.rpc('survivor_group_roster', { p_group_id: groupId })
    if (error) throw error

    return ((data ?? []) as SurvivorRosterRow[]).map((row) => ({
      userId: row.user_id,
      displayName: row.display_name ?? '',
      currentLife: row.current_life as SurvivorLife,
      status: row.status as SurvivorStatus,
      firstLossWeekId: row.first_loss_week_id,
      eliminatedWeekId: row.eliminated_week_id,
      finalRank: row.final_rank as 1 | 2 | 3 | null,
    }))
  }

  async recalculate(groupId: string): Promise<void> {
    const { error } = await this.client.rpc('recalculate_survivor_state', { p_group_id: groupId })
    if (error) throw error
  }

  async getCurrentWeekNumber(): Promise<number | null> {
    const { data, error } = await this.client.rpc('survivor_current_week_number')
    if (error) throw error
    return (data as number | null) ?? null
  }

  async requestLife(groupId: string, userId: string, lifeNumber: SurvivorLife): Promise<void> {
    const { error } = await this.client
      .from('survivor_life_requests')
      .insert({ group_id: groupId, user_id: userId, life_number: lifeNumber })
    if (error) throw error
  }

  async listLifeRequests(groupId: string): Promise<SurvivorLifeRequest[]> {
    const { data, error } = await this.client
      .from('survivor_life_requests')
      .select('id, user_id, life_number, status, requested_at, profiles(display_name)')
      .eq('group_id', groupId)
      .order('requested_at')
    if (error) throw error

    return (data ?? []).map((row) => {
      const profile = row.profiles as unknown as { display_name: string } | { display_name: string }[] | null
      const displayName = Array.isArray(profile) ? profile[0]?.display_name : profile?.display_name

      return {
        id: row.id as string,
        userId: row.user_id as string,
        displayName: displayName ?? '',
        lifeNumber: row.life_number as SurvivorLife,
        status: row.status as SurvivorLifeRequest['status'],
        requestedAt: row.requested_at as string,
      }
    })
  }

  async resolveLifeRequest(requestId: string, decision: SurvivorLifeRequestDecision): Promise<void> {
    const { error } = await this.client
      .from('survivor_life_requests')
      .update({ status: decision })
      .eq('id', requestId)
    if (error) throw error
  }
}
