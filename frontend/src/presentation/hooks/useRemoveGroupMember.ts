import { useCallback } from 'react'
import { removeGroupMember, type RemoveGroupMemberParams } from '@/core/use-cases/removeGroupMember'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: remover miembro de un grupo. */
export function useRemoveGroupMember() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: RemoveGroupMemberParams) => removeGroupMember(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
