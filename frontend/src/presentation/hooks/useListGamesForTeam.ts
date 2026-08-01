import { useCallback } from 'react'
import { listGamesForTeam, type ListGamesForTeamParams } from '@/core/use-cases/listGamesForTeam'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Calendario de un equipo. */
export function useListGamesForTeam() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListGamesForTeamParams) => listGamesForTeam(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
