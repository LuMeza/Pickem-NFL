import { useCallback } from 'react'
import {
  listSurvivorLifeRequests,
  type ListSurvivorLifeRequestsParams,
} from '@/core/use-cases/listSurvivorLifeRequests'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: solicitudes de vida de un grupo. */
export function useListSurvivorLifeRequests() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListSurvivorLifeRequestsParams) => listSurvivorLifeRequests(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
