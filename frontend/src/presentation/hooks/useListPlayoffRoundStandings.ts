import { useCallback } from 'react'
import { listPlayoffRoundStandings, type ListPlayoffRoundStandingsParams } from '@/core/use-cases/listPlayoffRoundStandings'
import type { PlayoffStandingRow } from '@/core/ports/PlayoffsRepository'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Tabla de resultados de una ronda de playoffs. */
export function useListPlayoffRoundStandings() {
  const repositories = useRepositories()
  const action = useCallback((params: ListPlayoffRoundStandingsParams) => listPlayoffRoundStandings(repositories, params), [repositories])
  return useAsyncAction<ListPlayoffRoundStandingsParams, PlayoffStandingRow[]>(action)
}
