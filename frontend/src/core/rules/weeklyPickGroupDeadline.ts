import type { Game } from '@/core/entities/catalog'

/** Dia de la semana del kickoff en hora del Este de EE. UU. (huso de la NFL), no el del navegador. */
const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' })

/** Lunes se agrupa con domingo (cierre conjunto, pedido explicito de producto); cualquier otro dia es su propio grupo. */
function groupDay(kickoffAt: Date): string {
  const day = dayFormatter.format(kickoffAt)
  return day === 'Mon' ? 'Sun' : day
}

/**
 * Cada dia de la semana cierra por separado, en el kickoff de su propio
 * primer partido — necesario porque la pretemporada mete jueves, viernes,
 * sabado y domingo dentro de la misma semana interna, y cerrarlos todos
 * juntos bloqueaba partidos que ni habian arrancado. Unica excepcion: el
 * lunes se agrupa con el domingo (cierra junto, en el kickoff del primer
 * partido de domingo). El dia se calcula en America/New_York para que un
 * Monday Night que cruza medianoche UTC no se clasifique mal — espejo en
 * cliente de `public.weekly_pick_group_deadline` (fuente de verdad en RLS).
 */
export function weeklyPickGroupDeadline(gamesInWeek: Game[], kickoffAt: Date): Date | null {
  const group = groupDay(kickoffAt)
  const groupGames = gamesInWeek.filter((game) => groupDay(game.kickoffAt) === group)
  if (groupGames.length === 0) return null
  return new Date(Math.min(...groupGames.map((game) => game.kickoffAt.getTime())))
}

/** True si ya inicio el primer partido del dia (o del domingo, si `game` es lunes) al que pertenece `game`. */
export function isWeeklyPickLocked(gamesInWeek: Game[], game: Game, now: Date): boolean {
  const deadline = weeklyPickGroupDeadline(gamesInWeek, game.kickoffAt)
  return deadline !== null && now.getTime() >= deadline.getTime()
}
