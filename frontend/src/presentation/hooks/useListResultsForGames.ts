import { useCallback } from 'react'
import { listResultsForGames, type ListResultsForGamesParams } from '@/core/use-cases/listResultsForGames'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Resultados de varios partidos en una sola consulta (panel admin, columna "Resultado" de la tabla). */
export function useListResultsForGames() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListResultsForGamesParams) => listResultsForGames(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
