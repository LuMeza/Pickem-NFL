import { useCallback } from 'react'
import { checkPlatformAdmin } from '@/core/use-cases/checkPlatformAdmin'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Guard del panel admin (tarea 7.3). */
export function useCheckPlatformAdmin() {
  const repositories = useRepositories()
  const action = useCallback(() => checkPlatformAdmin(repositories), [repositories])
  return useAsyncAction<void, boolean>(action)
}
