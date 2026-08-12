import type { Game } from '@/core/entities/catalog'

const WEEKEND_DAYS = new Set(['Sun', 'Mon', 'Sat'])

/** Dia de la semana del kickoff en hora del Este de EE. UU. (huso de la NFL), no el del navegador. */
const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' })

function isWeekendKickoff(kickoffAt: Date): boolean {
  return WEEKEND_DAYS.has(dayFormatter.format(kickoffAt))
}

/**
 * La Pickem Semanal ya no cierra toda la semana junta en el primer kickoff:
 * se divide en dos bloques. "Entre semana" (cualquier dia que no sea
 * sab/dom/lun — miercoles, jueves, viernes) cierra en el kickoff del primer
 * partido de ese bloque. "Fin de semana" (sabado/domingo/lunes) cierra en el
 * kickoff del primer partido de ese otro bloque (normalmente el partido del
 * sabado). El dia se calcula en America/New_York para que un Monday Night
 * que cruza medianoche UTC no se clasifique mal — espejo en cliente de
 * `public.weekly_pick_group_deadline` (fuente de verdad en RLS).
 */
export function weeklyPickGroupDeadline(gamesInWeek: Game[], kickoffAt: Date): Date | null {
  const weekend = isWeekendKickoff(kickoffAt)
  const groupGames = gamesInWeek.filter((game) => isWeekendKickoff(game.kickoffAt) === weekend)
  if (groupGames.length === 0) return null
  return new Date(Math.min(...groupGames.map((game) => game.kickoffAt.getTime())))
}

/** True si ya inicio el primer partido del bloque de dias (entre semana o fin de semana) al que pertenece `game`. */
export function isWeeklyPickLocked(gamesInWeek: Game[], game: Game, now: Date): boolean {
  const deadline = weeklyPickGroupDeadline(gamesInWeek, game.kickoffAt)
  return deadline !== null && now.getTime() >= deadline.getTime()
}
