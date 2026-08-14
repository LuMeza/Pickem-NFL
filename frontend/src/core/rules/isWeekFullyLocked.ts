import type { Game } from '@/core/entities/catalog'
import { isWeeklyPickLocked } from './weeklyPickGroupDeadline'

/**
 * True una vez que TODOS los partidos de la semana ya cruzaron el deadline
 * de su propio grupo de dia (ver weeklyPickGroupDeadline) — recien ahi es
 * seguro mostrarle a los usuarios los picks de los demas sin arriesgar que
 * alguien todavia sin elegir use esa info para decidir su propio pick.
 * Como el lunes se agrupa con domingo, en la practica esto coincide con "se
 * bloquearon todos los partidos, es decir domingo despues del primer
 * partido" (pedido de producto), sin necesidad de una regla aparte.
 */
export function isWeekFullyLocked(gamesInWeek: Game[], now: Date): boolean {
  if (gamesInWeek.length === 0) return false
  return gamesInWeek.every((game) => isWeeklyPickLocked(gamesInWeek, game, now))
}
