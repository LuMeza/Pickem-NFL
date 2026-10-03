import { useCallback } from 'react'
import {
  getWeeklyPicksReadyCount,
  type GetWeeklyPicksReadyCountParams,
} from '@/core/use-cases/getWeeklyPicksReadyCount'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Cuántos jugadores del grupo ya hicieron picks en la semana, para "Picks de todos" antes del cierre. */
export function useGetWeeklyPicksReadyCount() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: GetWeeklyPicksReadyCountParams) => getWeeklyPicksReadyCount(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
