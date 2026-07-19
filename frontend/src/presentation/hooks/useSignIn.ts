import { useCallback } from 'react'
import { signIn, type SignInParams } from '@/core/use-cases/signIn'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Pantalla de login. */
export function useSignIn() {
  const repositories = useRepositories()
  const action = useCallback((params: SignInParams) => signIn(repositories, params), [repositories])
  return useAsyncAction(action)
}
