import { useCallback } from 'react'
import { setPlatformAdmin, type SetPlatformAdminParams } from '@/core/use-cases/setPlatformAdmin'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: agregar/quitar administrador de plataforma. */
export function useSetPlatformAdmin() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: SetPlatformAdminParams) => setPlatformAdmin(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
