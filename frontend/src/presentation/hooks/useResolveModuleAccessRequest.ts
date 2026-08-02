import { useCallback } from 'react'
import {
  resolveModuleAccessRequest,
  type ResolveModuleAccessRequestParams,
} from '@/core/use-cases/resolveModuleAccessRequest'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: aprobar/rechazar una solicitud de acceso a módulo. */
export function useResolveModuleAccessRequest() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ResolveModuleAccessRequestParams) => resolveModuleAccessRequest(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
