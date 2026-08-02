import { useCallback } from 'react'
import {
  listAdminWeeklyPicksForUser,
  type ListAdminWeeklyPicksForUserParams,
} from '@/core/use-cases/listAdminWeeklyPicksForUser'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: histórico completo de picks de pickem semanal de un usuario. */
export function useListAdminWeeklyPicksForUser() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListAdminWeeklyPicksForUserParams) => listAdminWeeklyPicksForUser(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
