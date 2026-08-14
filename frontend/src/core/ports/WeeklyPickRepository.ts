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
 * El bloqueo cierra dia por dia — cada dia en el kickoff de su propio primer
 * partido, salvo el lunes que se agrupa con el domingo — no partido por
 * partido ni toda la semana junta. Fuente de verdad en RLS (`can_pick_game`
 * / `weekly_pick_group_deadline`);
 * este puerto solo expone la lectura/escritura, la UI refleja el mismo
 * criterio para dar feedback inmediato (ver
 * `core/rules/weeklyPickGroupDeadline`).
 */
export interface WeeklyPickRepository {
  /** Picks propios de una semana, indexados por game_id. */
  listPicksForWeek(userId: string, weekId: string): Promise<Record<string, WeeklyPickValue>>
  savePick(params: SaveWeeklyPickParams): Promise<void>
}
