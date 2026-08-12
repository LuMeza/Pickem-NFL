export type WeeklyPickValue = 'home' | 'away' | 'tie'

export interface SaveWeeklyPickParams {
  groupId: string
  userId: string
  gameId: string
  pick: WeeklyPickValue
}

/**
 * Predicciones del pickem semanal — ver
 * openspec/changes/modulo-pickem-semanal specs/prediccion-pickem-semanal.
 * El bloqueo cierra toda la semana en el kickoff del primer partido (no
 * partido por partido) — fuente de verdad en RLS (`can_pick_game` /
 * `week_kickoff_started`); este puerto solo expone la lectura/escritura, la
 * UI refleja el mismo criterio para dar feedback inmediato (ver
 * `core/rules/isWeekAccessLocked`).
 */
export interface WeeklyPickRepository {
  /** Picks propios de una semana, indexados por game_id. */
  listPicksForWeek(userId: string, weekId: string): Promise<Record<string, WeeklyPickValue>>
  savePick(params: SaveWeeklyPickParams): Promise<void>
}
