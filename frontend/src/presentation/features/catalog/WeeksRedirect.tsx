import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import { useListAllGames } from '@/presentation/hooks/useListAllGames'
import type { Game, Week } from '@/core/entities/catalog'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'

/** Un partido dura ~4h en cancha — mismo margen que usa GamesPage para considerar un partido "en vivo". */
const LIVE_WINDOW_MS = 4 * 60 * 60 * 1000

/**
 * La semana por defecto es la que tiene los partidos mas cercanos en el
 * tiempo, sin importar el tipo (hof, pretemporada, regular, playoffs) —
 * arranca en Hall of Fame si es lo primero que se juega, pasa a Pre 1, Pre 2,
 * etc., y asi hasta la temporada regular, en vez de saltar directo a la
 * semana 1 de temporada regular sin mirar el calendario real.
 */
function pickDefaultWeek(weeks: Week[], games: Game[], now: Date): Week {
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

/** /weeks ya no muestra un listado intermedio: entra directo a los partidos de la
 * semana con los partidos mas cercanos en el tiempo, con el WeekSelector de
 * GamesPage ya visible para saltar a cualquier otra. */
export function WeeksRedirect() {
  const { status: weeksStatus, data: weeks, error: weeksError, run: loadWeeks } = useListWeeks()
  const { status: gamesStatus, data: games, error: gamesError, run: loadGames } = useListAllGames()

  useEffect(() => {
    loadWeeks()
    loadGames()
  }, [loadWeeks, loadGames])

  if (weeksStatus === 'pending' || weeksStatus === 'idle' || gamesStatus === 'pending' || gamesStatus === 'idle') {
    return <p>Cargando semanas...</p>
  }
  if (weeksError || gamesError) return <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />
  if (!weeks || weeks.length === 0) return <EmptyState message={EMPTY_STATE_COPY.noWeeksAvailable} />

  const defaultWeek = pickDefaultWeek(weeks, games ?? [], new Date())
  return <Navigate to={`/weeks/${defaultWeek.id}/games`} replace />
}
