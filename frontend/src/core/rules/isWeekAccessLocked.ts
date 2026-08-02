import type { Game } from '@/core/entities/catalog'

/**
 * Tareas 2.2/2.4 (modulo-pickem-semanal): la solicitud y la
 * aprobación/rechazo de acceso semanal se deshabilitan en UI una vez que
 * inicio el partido con el kickoff más temprano de la semana. Espejo en
 * cliente de `public.week_kickoff_started` (fuente de verdad en RLS). Una
 * semana sin partidos cargados todavía no se considera bloqueada.
 */
export function isWeekAccessLocked(gamesInWeek: Game[], now: Date): boolean {
  if (gamesInWeek.length === 0) return false
  const earliestKickoff = Math.min(...gamesInWeek.map((game) => game.kickoffAt.getTime()))
  return now.getTime() >= earliestKickoff
}
