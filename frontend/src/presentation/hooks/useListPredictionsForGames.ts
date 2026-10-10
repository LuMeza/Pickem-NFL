import { useCallback } from 'react'
import {
  listPredictionsForGames,
  type ListPredictionsForGamesParams,
} from '@/core/use-cases/listPredictionsForGames'
import type { GamePrediction } from '@/core/entities/gamePrediction'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Pronósticos visibles de los partidos de la semana (hoja de picks). */
export function useListPredictionsForGames() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListPredictionsForGamesParams) => listPredictionsForGames(repositories, params),
    [repositories],
  )
  return useAsyncAction<ListPredictionsForGamesParams, Map<string, GamePrediction>>(action)
}
