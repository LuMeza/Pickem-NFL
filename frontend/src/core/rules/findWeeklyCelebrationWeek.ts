import type { Game, Week } from '@/core/entities/catalog'

/** Un partido de NFL dura ~3h; con 4h de margen se asume que ya terminó (misma ventana que getGameLiveStatus). */
const GAME_DURATION_MS = 4 * 60 * 60 * 1000

/** Pasada esta ventana la celebración ya no tiene sentido: evita festejar semanas viejas al entrar por primera vez. */
const CELEBRATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Semana que acaba de terminar y se puede celebrar: la más reciente de
 * temporada regular o playoffs cuyos partidos ya terminaron por tiempo
 * (todos pasaron su kickoff más la duración de un partido) y cuyo último
 * partido fue hace menos de una semana. Devuelve null si no hay ninguna.
 * Que los resultados estén cargados se confirma aparte, con los datos reales.
 */
export function findWeeklyCelebrationWeek(weeks: Week[], games: Game[], now: Date): Week | null {
  let best: { week: Week; lastKickoffMs: number } | null = null

  for (const week of weeks) {
    if (week.type !== 'regular' && week.type !== 'playoffs') continue
    const kickoffs = games.filter((game) => game.weekId === week.id).map((game) => game.kickoffAt.getTime())
    if (kickoffs.length === 0) continue

    const lastKickoffMs = Math.max(...kickoffs)
    const finishedMs = now.getTime() - (lastKickoffMs + GAME_DURATION_MS)
    if (finishedMs < 0) continue
    if (now.getTime() - lastKickoffMs > CELEBRATION_WINDOW_MS) continue

    if (!best || lastKickoffMs > best.lastKickoffMs) best = { week, lastKickoffMs }
  }

  return best?.week ?? null
}
