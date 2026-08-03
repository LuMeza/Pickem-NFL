import type { Game, Week } from '@/core/entities/catalog'

/** Un partido dura ~4h en cancha — mismo margen que usa GamesPage para considerar un partido "en vivo". */
const LIVE_WINDOW_MS = 4 * 60 * 60 * 1000

/**
 * La semana por defecto es la que tiene los partidos más cercanos en el
 * tiempo, sin importar el tipo (hof, pretemporada, regular, playoffs) —
 * arranca en Hall of Fame si es lo primero que se juega, pasa a Pre 1, Pre 2,
 * etc., y así hasta la temporada regular, en vez de saltar directo a la
 * semana 1 de temporada regular sin mirar el calendario real.
 */
export function pickDefaultWeek(weeks: Week[], games: Game[], now: Date): Week {
  const gamesByWeek = new Map<string, Game[]>()
  for (const game of games) {
    const bucket = gamesByWeek.get(game.weekId)
    if (bucket) bucket.push(game)
    else gamesByWeek.set(game.weekId, [game])
  }

  const weeksWithGames = weeks
    .map((week) => ({ week, weekGames: gamesByWeek.get(week.id) ?? [] }))
    .filter((entry) => entry.weekGames.length > 0)
    .map((entry) => ({
      week: entry.week,
      earliestKickoff: Math.min(...entry.weekGames.map((game) => game.kickoffAt.getTime())),
      latestRelevant: Math.max(...entry.weekGames.map((game) => game.kickoffAt.getTime() + LIVE_WINDOW_MS)),
    }))
    .sort((a, b) => a.earliestKickoff - b.earliestKickoff)

  const current = weeksWithGames.find((entry) => now.getTime() < entry.latestRelevant)
  if (current) return current.week
  if (weeksWithGames.length > 0) return weeksWithGames[weeksWithGames.length - 1]!.week

  const regularWeeks = weeks.filter((week) => week.type === 'regular')
  const pool = regularWeeks.length > 0 ? regularWeeks : weeks
  return [...pool].sort((a, b) => a.number - b.number)[0]!
}
