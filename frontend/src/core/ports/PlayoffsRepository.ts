import type { PlayoffResultCategory } from '@/core/entities/playoffResult'

export type PlayoffPickValue = PlayoffResultCategory

export interface SavePlayoffPickParams {
  groupId: string
  userId: string
  gameId: string
  pick: PlayoffPickValue
}

export interface PlayoffStandingRow {
  userId: string
  displayName: string
  correctCount: number
}

/**
 * Predicciones y tablas del módulo Playoffs — ver
 * openspec/changes/modulo-playoffs specs/prediccion-playoffs y tabla-playoffs.
 * El bloqueo al kickoff y la restricción a semanas de playoffs viven en RLS
 * (`can_pick_playoff_game`); las tablas se calculan on-the-fly en funciones
 * SQL SECURITY DEFINER (`playoff_round_standings`, `playoff_final_standings`).
 */
export interface PlayoffsRepository {
  /** Picks propios de una ronda de playoffs, indexados por game_id. */
  listPicksForWeek(userId: string, weekId: string): Promise<Record<string, PlayoffPickValue>>
  savePick(params: SavePlayoffPickParams): Promise<void>
  /** True si el usuario actual puede ver las tablas del grupo (miembro o admin). */
  canViewTables(groupId: string): Promise<boolean>
  listRoundStandings(groupId: string, weekId: string): Promise<PlayoffStandingRow[]>
  listFinalStandings(groupId: string): Promise<PlayoffStandingRow[]>
}
