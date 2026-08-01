import { useCallback } from 'react'
import {
  listAdminWeeklyPicksForWeek,
  type ListAdminWeeklyPicksForWeekParams,
} from '@/core/use-cases/listAdminWeeklyPicksForWeek'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: picks de todos los usuarios en pickem semanal, para una semana. */
export function useListAdminWeeklyPicksForWeek() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListAdminWeeklyPicksForWeekParams) => listAdminWeeklyPicksForWeek(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
