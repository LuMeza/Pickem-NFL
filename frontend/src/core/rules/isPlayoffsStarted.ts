import type { Game, Week } from '@/core/entities/catalog'

/**
 * Tarea 6.4 (base-plataforma): determina si la ronda de playoffs ya inicio,
 * consultando si algun partido de una semana tipo 'playoffs' ya tuvo kickoff.
 * Reutiliza `kickoff_at` como unica nocion de "ya inicio" (ver design.md,
 * Open Questions), en vez de un flag separado en `weeks`.
 */
export function isPlayoffsStarted(weeks: Week[], games: Game[], now: Date): boolean {
  const playoffsWeekIds = new Set(weeks.filter((week) => week.type === 'playoffs').map((week) => week.id))

  return games.some((game) => playoffsWeekIds.has(game.weekId) && game.kickoffAt.getTime() <= now.getTime())
}
