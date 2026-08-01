import { useCallback } from 'react'
import {
  resolveSurvivorLifeRequest,
  type ResolveSurvivorLifeRequestParams,
} from '@/core/use-cases/resolveSurvivorLifeRequest'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Aprobacion/rechazo de una solicitud de vida por el administrador. */
export function useResolveSurvivorLifeRequest() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ResolveSurvivorLifeRequestParams) => resolveSurvivorLifeRequest(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
