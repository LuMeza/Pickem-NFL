import { Navigate } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import type { Week } from '@/core/entities/catalog'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'

function pickDefaultWeek(weeks: Week[]): Week {
  const regularWeeks = weeks.filter((week) => week.type === 'regular')
  const pool = regularWeeks.length > 0 ? regularWeeks : weeks
  return [...pool].sort((a, b) => a.number - b.number)[0]!
}

/** /pickem/tabla entra directo a la tabla de la semana por defecto, igual que WeeksRedirect. */
export function PickemStandingsRedirect() {
  const { status, data: weeks, error } = useSession().weeks

  if (status === 'pending' || status === 'idle') return <LoadingSpinner label="Cargando semanas" />
  if (error) return <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />
  if (!weeks || weeks.length === 0) return <EmptyState message={EMPTY_STATE_COPY.noWeeksAvailable} />

  const defaultWeek = pickDefaultWeek(weeks)
  return <Navigate to={`/pickem/tabla/${defaultWeek.id}`} replace />
}
