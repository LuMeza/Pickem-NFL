import { useCallback } from 'react'
import { listWeeks } from '@/core/use-cases/listWeeks'
import type { Week } from '@/core/entities/catalog'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Catálogo de semanas de temporada. */
export function useListWeeks() {
  const repositories = useRepositories()
  const action = useCallback(() => listWeeks(repositories), [repositories])
  return useAsyncAction<void, Week[]>(action)
}
