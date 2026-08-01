import { useCallback } from 'react'
import { listGroupMembers, type ListGroupMembersParams } from '@/core/use-cases/listGroupMembers'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: listado de miembros de un grupo. */
export function useListGroupMembers() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListGroupMembersParams) => listGroupMembers(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
