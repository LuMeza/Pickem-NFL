import type { GameOutcome } from '@/core/entities/gameResult'
import type { WeeklyPickValue } from './WeeklyPickRepository'

export interface WeeklyPickBoardRow {
  userId: string
  displayName: string
  gameId: string
  pick: WeeklyPickValue | null
  outcome: GameOutcome | null
}

/**
 * Picks de todos los miembros del grupo para una semana de pickem semanal,
 * visibles para cualquier usuario con acceso a las tablas de posiciones
 * (mismo gate que PickemStandingsRepository.canViewTables) recien cuando la
 * semana entera esta bloqueada (ver core/rules/isWeekFullyLocked). El RLS de
 * weekly_picks solo permite leer filas propias, asi que la implementacion
 * llama a una funcion SQL security definer (ver migracion
 * 20260814000004_weekly_picks_board) que aplica ambos chequeos server-side.
 */
export interface WeeklyPicksBoardRepository {
  listPicksForWeek(groupId: string, weekId: string): Promise<WeeklyPickBoardRow[]>
}
