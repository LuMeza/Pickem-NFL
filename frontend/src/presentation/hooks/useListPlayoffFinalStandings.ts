import { useCallback } from 'react'
import { listPlayoffFinalStandings, type ListPlayoffFinalStandingsParams } from '@/core/use-cases/listPlayoffFinalStandings'
import type { PlayoffStandingRow } from '@/core/ports/PlayoffsRepository'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Ranking final acumulado de playoffs. */
export function useListPlayoffFinalStandings() {
  const repositories = useRepositories()
  const action = useCallback((params: ListPlayoffFinalStandingsParams) => listPlayoffFinalStandings(repositories, params), [repositories])
  return useAsyncAction<ListPlayoffFinalStandingsParams, PlayoffStandingRow[]>(action)
}
