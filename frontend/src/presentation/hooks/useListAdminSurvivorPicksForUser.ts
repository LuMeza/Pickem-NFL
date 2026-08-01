import { useCallback } from 'react'
import {
  listAdminSurvivorPicksForUser,
  type ListAdminSurvivorPicksForUserParams,
} from '@/core/use-cases/listAdminSurvivorPicksForUser'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: historico completo de picks de survivor de un usuario. */
export function useListAdminSurvivorPicksForUser() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListAdminSurvivorPicksForUserParams) => listAdminSurvivorPicksForUser(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
