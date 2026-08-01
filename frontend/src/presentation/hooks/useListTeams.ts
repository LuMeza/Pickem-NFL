import { useCallback } from 'react'
import { listTeams } from '@/core/use-cases/listTeams'
import type { Team } from '@/core/entities/catalog'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Catalogo de equipos NFL. */
export function useListTeams() {
  const repositories = useRepositories()
  const action = useCallback(() => listTeams(repositories), [repositories])
  return useAsyncAction<void, Team[]>(action)
}
