import { useCallback } from 'react'
import { createUser, type CreateUserParams } from '@/core/use-cases/createUser'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: alta de usuario con contrasena provisional. */
export function useCreateUser() {
  const repositories = useRepositories()
  const action = useCallback((params: CreateUserParams) => createUser(repositories, params), [repositories])
  return useAsyncAction(action)
}
