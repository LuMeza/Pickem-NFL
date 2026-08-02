import type { StandingRow } from '@/core/entities/standings'

/**
 * Tablas de posiciones del pickem semanal — ver
 * openspec/changes/modulo-pickem-semanal specs/tabla-pickem-semanal.
 * Calculadas on-the-fly en funciones SQL SECURITY DEFINER (ver design.md
 * decision 2 y migración quiniela_standings_functions, renombrada por
 * 20260731030000_rename_quiniela_to_pickem), que reimplementan la
 * regla de visibilidad en vez de depender de RLS fila por fila.
 */
export interface PickemStandingsRepository {
  /** True si el usuario actual puede ver las tablas de este grupo (admin, tuvo acceso semanal alguna vez, o visibilidad habilitada). */
  canViewTables(groupId: string): Promise<boolean>
  listWeeklyStandings(groupId: string, weekId: string): Promise<StandingRow[]>
  listSeasonStandings(groupId: string): Promise<StandingRow[]>
  /** Panel admin (tarea 4.5): valor crudo guardado en `pickem_settings` (false si no hay fila todavía). */
  getTablesVisibleToAll(groupId: string): Promise<boolean>
  setTablesVisibleToAll(groupId: string, visible: boolean): Promise<void>
}
