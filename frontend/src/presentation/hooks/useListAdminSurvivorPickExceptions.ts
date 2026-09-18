import { useCallback } from 'react'
import {
  listAdminSurvivorPickExceptions,
  type ListAdminSurvivorPickExceptionsParams,
} from '@/core/use-cases/listAdminSurvivorPickExceptions'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: semanas con acceso excepcional de pick activo para un usuario puntual. */
export function useListAdminSurvivorPickExceptions() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListAdminSurvivorPickExceptionsParams) => listAdminSurvivorPickExceptions(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
