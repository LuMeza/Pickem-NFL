import { useCallback } from 'react'
import {
  listWeeklyAccessRequests,
  type ListWeeklyAccessRequestsParams,
} from '@/core/use-cases/listWeeklyAccessRequests'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: solicitudes de acceso semanal de un grupo. */
export function useListWeeklyAccessRequests() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListWeeklyAccessRequestsParams) => listWeeklyAccessRequests(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
