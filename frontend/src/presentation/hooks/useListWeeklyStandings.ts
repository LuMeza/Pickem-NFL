import { useCallback } from 'react'
import { listWeeklyStandings, type ListWeeklyStandingsParams } from '@/core/use-cases/listWeeklyStandings'
import type { StandingRow } from '@/core/entities/standings'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Tabla de posiciones de una semana del pickem. */
export function useListWeeklyStandings() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListWeeklyStandingsParams) => listWeeklyStandings(repositories, params),
    [repositories],
  )
  return useAsyncAction<ListWeeklyStandingsParams, StandingRow[]>(action)
}
