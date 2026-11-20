import type { Game } from '@/core/entities/catalog'
import { weeklyPickGroupDeadline } from './weeklyPickGroupDeadline'

/**
 * Momento en que se abren los picks de todos: cuando cierra el último grupo
 * de días de la semana (ver weeklyPickGroupDeadline). Null si la semana no
 * tiene partidos.
 */
export function weeklyPicksBoardOpensAt(gamesInWeek: Game[]): Date | null {
  return gamesInWeek.reduce<Date | null>((latest, game) => {
    const deadline = weeklyPickGroupDeadline(gamesInWeek, game.kickoffAt)
    return deadline && (!latest || deadline > latest) ? deadline : latest
  }, null)
}
