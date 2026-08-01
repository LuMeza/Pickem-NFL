import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useListWeeks } from '@/presentation/hooks/useListWeeks'
import type { Week } from '@/core/entities/catalog'
import { EmptyState } from '@/presentation/components/EmptyState/EmptyState'
import { EMPTY_STATE_COPY } from '@/presentation/components/EmptyState/emptyStateCopy'

function pickDefaultWeek(weeks: Week[]): Week {
  const regularWeeks = weeks.filter((week) => week.type === 'regular')
  const pool = regularWeeks.length > 0 ? regularWeeks : weeks
  return [...pool].sort((a, b) => a.number - b.number)[0]!
}

/** /weeks ya no muestra un listado intermedio: entra directo a los partidos de una
 * semana por defecto (la primera de temporada regular), con el WeekSelector de
 * GamesPage ya visible para saltar a cualquier otra. */
export function WeeksRedirect() {
  const { status, data: weeks, error, run } = useListWeeks()

  useEffect(() => {
    run()
  }, [run])

  if (status === 'pending' || status === 'idle') return <p>Cargando semanas...</p>
  if (error) return <EmptyState message={EMPTY_STATE_COPY.resultsLoadError} />
  if (!weeks || weeks.length === 0) return <EmptyState message={EMPTY_STATE_COPY.noWeeksAvailable} />

  const defaultWeek = pickDefaultWeek(weeks)
  return <Navigate to={`/weeks/${defaultWeek.id}/games`} replace />
}
