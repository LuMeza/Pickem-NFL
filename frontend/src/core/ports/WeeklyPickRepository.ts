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
 * El bloqueo por kickoff y la exigencia de `weekly_access` aprobado son la
 * fuente de verdad en RLS (`can_pick_game`); este puerto solo expone la
 * lectura/escritura, la UI refleja el mismo criterio para dar feedback
 * inmediato (ver `core/rules/isPredictionLocked`).
 */
export interface WeeklyPickRepository {
  /** Picks propios de una semana, indexados por game_id. */
  listPicksForWeek(userId: string, weekId: string): Promise<Record<string, WeeklyPickValue>>
  savePick(params: SaveWeeklyPickParams): Promise<void>
}
