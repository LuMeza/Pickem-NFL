import { useCallback } from 'react'
import { createGroup, type CreateGroupParams } from '@/core/use-cases/createGroup'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: creacion de grupo privado. */
export function useCreateGroup() {
  const repositories = useRepositories()
  const action = useCallback((params: CreateGroupParams) => createGroup(repositories, params), [repositories])
  return useAsyncAction(action)
}
