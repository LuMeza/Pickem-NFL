import { useCallback } from 'react'
import {
  listModuleAccessRequests,
  type ListModuleAccessRequestsParams,
} from '@/core/use-cases/listModuleAccessRequests'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: solicitudes de acceso a modulo de un grupo. */
export function useListModuleAccessRequests() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListModuleAccessRequestsParams) => listModuleAccessRequests(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
