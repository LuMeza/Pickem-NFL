import { useCallback } from 'react'
import { deleteUser, type DeleteUserParams } from '@/core/use-cases/deleteUser'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: elimina la cuenta de un usuario. */
export function useDeleteUser() {
  const repositories = useRepositories()
  const action = useCallback((params: DeleteUserParams) => deleteUser(repositories, params), [repositories])
  return useAsyncAction(action)
}
