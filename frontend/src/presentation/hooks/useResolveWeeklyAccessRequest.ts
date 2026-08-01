import { useCallback } from 'react'
import {
  resolveWeeklyAccessRequest,
  type ResolveWeeklyAccessRequestParams,
} from '@/core/use-cases/resolveWeeklyAccessRequest'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: aprobar/rechazar una solicitud de acceso semanal. */
export function useResolveWeeklyAccessRequest() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ResolveWeeklyAccessRequestParams) => resolveWeeklyAccessRequest(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
