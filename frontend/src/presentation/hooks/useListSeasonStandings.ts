import { useCallback } from 'react'
import { listSeasonStandings, type ListSeasonStandingsParams } from '@/core/use-cases/listSeasonStandings'
import type { StandingRow } from '@/core/entities/standings'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Tabla acumulada de temporada del pickem. */
export function useListSeasonStandings() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListSeasonStandingsParams) => listSeasonStandings(repositories, params),
    [repositories],
  )
  return useAsyncAction<ListSeasonStandingsParams, StandingRow[]>(action)
}
