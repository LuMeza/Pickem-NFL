import { useCallback } from 'react'
import { listGamesForWeek, type ListGamesForWeekParams } from '@/core/use-cases/listGamesForWeek'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Partidos de una semana. */
export function useListGamesForWeek() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListGamesForWeekParams) => listGamesForWeek(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
