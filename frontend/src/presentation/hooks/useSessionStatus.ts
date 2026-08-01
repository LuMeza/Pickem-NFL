import { useCallback } from 'react'
import { getSessionStatus, type SessionStatus } from '@/core/use-cases/getSessionStatus'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Estado de sesion (autenticado / cambio de contrasena pendiente) para los guards de ruta. */
export function useSessionStatus() {
  const repositories = useRepositories()
  const action = useCallback(() => getSessionStatus(repositories), [repositories])
  return useAsyncAction<void, SessionStatus>(action)
}
