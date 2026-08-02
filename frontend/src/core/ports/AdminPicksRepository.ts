import type { GameOutcome } from '@/core/entities/gameResult'
import type { SurvivorLife, SurvivorStatus } from '@/core/entities/survivor'
import type { WeeklyPickValue } from './WeeklyPickRepository'

export interface AdminWeeklyPickRow {
  userId: string
  displayName: string
  gameId: string
  pick: WeeklyPickValue | null
  outcome: GameOutcome | null
}

export interface AdminSurvivorPickRow {
  userId: string
  displayName: string
  teamId: string | null
  lifeNumber: SurvivorLife | null
  status: SurvivorStatus
}

export interface AdminUserWeeklyPick {
  weekId: string
  gameId: string
  pick: WeeklyPickValue | null
  outcome: GameOutcome | null
}

export interface AdminUserSurvivorPick {
  weekId: string
  teamId: string | null
  lifeNumber: SurvivorLife | null
}

/**
 * Panel admin: lectura de picks de cualquier usuario del grupo (pickem
 * semanal y survivor; playoffs fuera de alcance mientras no exista ese
 * módulo). El RLS de weekly_picks/survivor_picks solo permite leer filas
 * propias, así que estos métodos llaman a funciones SQL security definer
 * con chequeo is_platform_admin (ver migración 20260801000002_admin_picks_functions).
 */
export interface AdminPicksRepository {
  listWeeklyPicksForWeek(groupId: string, weekId: string): Promise<AdminWeeklyPickRow[]>
  listSurvivorPicksForWeek(groupId: string, weekId: string): Promise<AdminSurvivorPickRow[]>
  listWeeklyPicksForUser(groupId: string, userId: string): Promise<AdminUserWeeklyPick[]>
  listSurvivorPicksForUser(groupId: string, userId: string): Promise<AdminUserSurvivorPick[]>
}
