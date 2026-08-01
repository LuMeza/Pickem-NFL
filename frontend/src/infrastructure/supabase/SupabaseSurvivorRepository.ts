import type { SupabaseClient } from '@supabase/supabase-js'
import type { SaveSurvivorPickParams, SurvivorRepository } from '@/core/ports/SurvivorRepository'
import type { SurvivorLife, SurvivorParticipant, SurvivorPick, SurvivorStatus } from '@/core/entities/survivor'

interface SurvivorStateRow {
  user_id: string
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
    const [membersResult, stateResult] = await Promise.all([
      this.client.from('group_members').select('user_id, profiles(display_name)').eq('group_id', groupId),
      this.client
        .from('survivor_state')
        .select('user_id, current_life, status, first_loss_week_id, eliminated_week_id, final_rank')
        .eq('group_id', groupId),
    ])
    if (membersResult.error) throw membersResult.error
    if (stateResult.error) throw stateResult.error

    const stateByUser = new Map(
      ((stateResult.data ?? []) as SurvivorStateRow[]).map((row) => [row.user_id, row]),
    )

    return (membersResult.data ?? []).map((member) => {
      const profile = member.profiles as unknown as { display_name: string } | { display_name: string }[] | null
      const displayName = Array.isArray(profile) ? profile[0]?.display_name : profile?.display_name
      const state = stateByUser.get(member.user_id as string)

      return {
        userId: member.user_id as string,
        displayName: displayName ?? '',
        currentLife: (state?.current_life ?? 1) as SurvivorLife,
        status: (state?.status ?? 'alive') as SurvivorStatus,
        firstLossWeekId: state?.first_loss_week_id ?? null,
        eliminatedWeekId: state?.eliminated_week_id ?? null,
        finalRank: (state?.final_rank ?? null) as 1 | 2 | 3 | null,
      }
    })
  }

  async recalculate(groupId: string): Promise<void> {
    const { error } = await this.client.rpc('recalculate_survivor_state', { p_group_id: groupId })
    if (error) throw error
  }
}
