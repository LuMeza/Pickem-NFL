import { useCallback } from 'react'
import { requestModuleAccess, type RequestModuleAccessParams } from '@/core/use-cases/requestModuleAccess'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Solicitud de acceso a un modulo opcional (ej. Quiniela Semanal). */
export function useRequestModuleAccess() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: RequestModuleAccessParams) => requestModuleAccess(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
