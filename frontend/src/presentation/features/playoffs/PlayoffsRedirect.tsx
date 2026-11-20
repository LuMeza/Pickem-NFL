import { Navigate } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'

/**
 * /playoffs entra directo a la primera ronda de playoffs que todavía tiene un
 * partido por jugarse; si todas ya iniciaron, a la última (la más reciente).
 */
export function PlayoffsRedirect({ basePath = '/playoffs' }: { basePath?: string }) {
  const { status: weeksStatus, data: weeks, error: weeksError } = useSession().weeks
  const { status: gamesStatus, data: games, error: gamesError } = useSession().games

  if (weeksStatus === 'pending' || weeksStatus === 'idle' || gamesStatus === 'pending' || gamesStatus === 'idle') {
    return <LoadingSpinner label="Cargando rondas" />
  }
  if (weeksError || gamesError) return <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />

  const rounds = (weeks ?? []).filter((week) => week.type === 'playoffs').sort((a, b) => a.number - b.number)
  if (rounds.length === 0) return <EmptyState message="Todavía no hay rondas de playoffs cargadas." />

  const now = Date.now()
  const upcoming = rounds.find((round) =>
    (games ?? []).some((game) => game.weekId === round.id && game.kickoffAt.getTime() > now),
  )
  const target = upcoming ?? rounds[rounds.length - 1]!
  return <Navigate to={`${basePath}/${target.id}`} replace />
}
