import { useCallback } from 'react'
import { getDefaultGroup } from '@/core/use-cases/getDefaultGroup'
import type { GroupSummary } from '@/core/ports/GroupRepository'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Grupo unico global — ver core/use-cases/getDefaultGroup. */
export function useDefaultGroup() {
  const repositories = useRepositories()
  const action = useCallback(() => getDefaultGroup(repositories), [repositories])
  return useAsyncAction<void, GroupSummary>(action)
}
