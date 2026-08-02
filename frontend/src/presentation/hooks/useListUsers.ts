import { useCallback } from 'react'
import { listUsers } from '@/core/use-cases/listUsers'
import type { AdminUserSummary } from '@/core/ports'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: listado de todos los usuarios. */
export function useListUsers() {
  const repositories = useRepositories()
  const action = useCallback(() => listUsers(repositories), [repositories])
  return useAsyncAction<void, AdminUserSummary[]>(action)
}
