import { useCallback } from 'react'
import { listPlayersForTeam, type ListPlayersForTeamParams } from '@/core/use-cases/listPlayersForTeam'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Plantilla de un equipo. */
export function useListPlayersForTeam() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListPlayersForTeamParams) => listPlayersForTeam(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
