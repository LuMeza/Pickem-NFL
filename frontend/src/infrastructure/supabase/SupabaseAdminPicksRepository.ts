import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AdminPicksRepository,
  AdminSurvivorPickRow,
  AdminUserSurvivorPick,
  AdminUserWeeklyPick,
  AdminWeeklyPickRow,
} from '@/core/ports/AdminPicksRepository'

interface WeeklyForWeekRow {
  user_id: string
  display_name: string
  game_id: string
  pick: string | null
  outcome: string | null
}

interface SurvivorForWeekRow {
  user_id: string
  display_name: string
  team_id: string | null
  life_number: number | null
  status: string
}

interface WeeklyForUserRow {
  week_id: string
  game_id: string
  pick: string | null
  outcome: string | null
}

interface SurvivorForUserRow {
  week_id: string
  team_id: string | null
  life_number: number | null
}

export class SupabaseAdminPicksRepository implements AdminPicksRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async listWeeklyPicksForWeek(groupId: string, weekId: string): Promise<AdminWeeklyPickRow[]> {
    const { data, error } = await this.client.rpc('admin_weekly_picks_for_week', {
      p_group_id: groupId,
      p_week_id: weekId,
    })
    if (error) throw error

    return ((data ?? []) as WeeklyForWeekRow[]).map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      gameId: row.game_id,
      pick: row.pick as AdminWeeklyPickRow['pick'],
      outcome: row.outcome as AdminWeeklyPickRow['outcome'],
    }))
  }

  async listSurvivorPicksForWeek(groupId: string, weekId: string): Promise<AdminSurvivorPickRow[]> {
    const { data, error } = await this.client.rpc('admin_survivor_picks_for_week', {
      p_group_id: groupId,
      p_week_id: weekId,
    })
    if (error) throw error

    return ((data ?? []) as SurvivorForWeekRow[]).map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      teamId: row.team_id,
      lifeNumber: row.life_number as AdminSurvivorPickRow['lifeNumber'],
      status: row.status as AdminSurvivorPickRow['status'],
    }))
  }

  async listWeeklyPicksForUser(groupId: string, userId: string): Promise<AdminUserWeeklyPick[]> {
    const { data, error } = await this.client.rpc('admin_weekly_picks_for_user', {
      p_group_id: groupId,
      p_user_id: userId,
    })
    if (error) throw error

    return ((data ?? []) as WeeklyForUserRow[]).map((row) => ({
      weekId: row.week_id,
      gameId: row.game_id,
      pick: row.pick as AdminUserWeeklyPick['pick'],
      outcome: row.outcome as AdminUserWeeklyPick['outcome'],
    }))
  }

  async listSurvivorPicksForUser(groupId: string, userId: string): Promise<AdminUserSurvivorPick[]> {
    const { data, error } = await this.client.rpc('admin_survivor_picks_for_user', {
      p_group_id: groupId,
      p_user_id: userId,
    })
    if (error) throw error

    return ((data ?? []) as SurvivorForUserRow[]).map((row) => ({
      weekId: row.week_id,
      teamId: row.team_id,
      lifeNumber: row.life_number as AdminUserSurvivorPick['lifeNumber'],
    }))
  }
}
