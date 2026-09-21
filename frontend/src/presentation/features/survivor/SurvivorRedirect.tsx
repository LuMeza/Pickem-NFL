import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useGetSurvivorCurrentWeek } from '@/presentation/hooks/useGetSurvivorCurrentWeek'
import { useSession } from '@/presentation/hooks/SessionContext'
import type { Week } from '@/core/entities/catalog'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner/LoadingSpinner'

/**
 * Survivor solo aplica a temporada regular (ver design.md decision 1). Entra a la semana en curso (la primera con
 * partidos pendientes, o la siguiente si ya terminó); si todas se resolvieron, a la última.
 */
function pickDefaultWeek(weeks: Week[], currentWeekNumber: number | null): Week | null {
  const regularWeeks = weeks.filter((week) => week.type === 'regular').sort((a, b) => a.number - b.number)
  if (regularWeeks.length === 0) return null
  if (currentWeekNumber == null) return regularWeeks[regularWeeks.length - 1]!
  return regularWeeks.find((week) => week.number === currentWeekNumber) ?? regularWeeks[0]!
}

export function SurvivorRedirect() {
  const { status, data: weeks, error } = useSession().weeks
  const { status: currentStatus, data: currentWeekNumber, run: loadCurrentWeekNumber } = useGetSurvivorCurrentWeek()

  useEffect(() => {
    loadCurrentWeekNumber()
  }, [loadCurrentWeekNumber])

  if (status === 'pending' || status === 'idle' || currentStatus === 'idle' || currentStatus === 'pending') {
    return <LoadingSpinner label="Cargando semanas" />
  }
  if (error) return <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />

  const defaultWeek = weeks ? pickDefaultWeek(weeks, currentWeekNumber ?? null) : null
  if (!defaultWeek) return <EmptyState message={EMPTY_STATE_COPY.noWeeksAvailable} />

  return <Navigate to={`/survivor/semana/${defaultWeek.id}`} replace />
}
