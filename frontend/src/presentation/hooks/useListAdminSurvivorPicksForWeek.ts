import { useCallback } from 'react'
import {
  listAdminSurvivorPicksForWeek,
  type ListAdminSurvivorPicksForWeekParams,
} from '@/core/use-cases/listAdminSurvivorPicksForWeek'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: picks de todos los usuarios en survivor, para una semana. */
export function useListAdminSurvivorPicksForWeek() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListAdminSurvivorPicksForWeekParams) => listAdminSurvivorPicksForWeek(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
