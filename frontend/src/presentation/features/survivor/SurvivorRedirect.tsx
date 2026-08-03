import { Navigate } from 'react-router-dom'
import { useSession } from '@/presentation/hooks/SessionContext'
import type { Week } from '@/core/entities/catalog'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'

/** Survivor solo aplica a temporada regular (ver design.md decision 1) — entra directo a la primera semana regular. */
function pickDefaultWeek(weeks: Week[]): Week | null {
  const regularWeeks = weeks.filter((week) => week.type === 'regular')
  if (regularWeeks.length === 0) return null
  return [...regularWeeks].sort((a, b) => a.number - b.number)[0]!
}

export function SurvivorRedirect() {
  const { status, data: weeks, error } = useSession().weeks

  if (status === 'pending' || status === 'idle') return <LoadingSpinner label="Cargando semanas" />
  if (error) return <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />

  const defaultWeek = weeks ? pickDefaultWeek(weeks) : null
  if (!defaultWeek) return <EmptyState message={EMPTY_STATE_COPY.noWeeksAvailable} />

  return <Navigate to={`/survivor/semana/${defaultWeek.id}`} replace />
}
