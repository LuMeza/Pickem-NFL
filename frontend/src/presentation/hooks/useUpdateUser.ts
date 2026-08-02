import { useCallback } from 'react'
import { updateUser, type UpdateUserParams } from '@/core/use-cases/updateUser'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: edita nombre visible y correo de un usuario. */
export function useUpdateUser() {
  const repositories = useRepositories()
  const action = useCallback((params: UpdateUserParams) => updateUser(repositories, params), [repositories])
  return useAsyncAction(action)
}
