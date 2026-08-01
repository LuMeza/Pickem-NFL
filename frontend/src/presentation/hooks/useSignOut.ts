import { useCallback } from 'react'
import { signOut } from '@/core/use-cases/signOut'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Cierre de sesion. */
export function useSignOut() {
  const repositories = useRepositories()
  const action = useCallback(() => signOut(repositories), [repositories])
  return useAsyncAction<void, void>(action)
}
