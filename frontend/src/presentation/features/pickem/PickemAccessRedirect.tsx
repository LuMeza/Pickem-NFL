import { Navigate } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import { pickDefaultWeek } from '@/core/rules/pickDefaultWeek'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'

/** /pickem/acceso entra directo a la semana con los partidos más cercanos en el tiempo, igual que WeeksRedirect. */
export function PickemAccessRedirect() {
  const { status: weeksStatus, data: weeks, error: weeksError } = useSession().weeks
  const { status: gamesStatus, data: games, error: gamesError } = useSession().games

  if (weeksStatus === 'pending' || weeksStatus === 'idle' || gamesStatus === 'pending' || gamesStatus === 'idle') {
    return <LoadingSpinner label="Cargando semanas" />
  }
  if (weeksError || gamesError) return <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />
  if (!weeks || weeks.length === 0) return <EmptyState message={EMPTY_STATE_COPY.noWeeksAvailable} />

  const defaultWeek = pickDefaultWeek(weeks, games ?? [], new Date())
  return <Navigate to={`/pickem/acceso/${defaultWeek.id}`} replace />
}
