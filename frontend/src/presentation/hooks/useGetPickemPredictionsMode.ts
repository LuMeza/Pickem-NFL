import { useCallback } from 'react'
import {
  getPickemPredictionsMode,
  type GetPickemPredictionsModeParams,
} from '@/core/use-cases/getPickemPredictionsMode'
import type { PredictionsMode } from '@/core/entities/gamePrediction'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: modo actual de visibilidad de pronósticos. */
export function useGetPickemPredictionsMode() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: GetPickemPredictionsModeParams) => getPickemPredictionsMode(repositories, params),
    [repositories],
  )
  return useAsyncAction<GetPickemPredictionsModeParams, PredictionsMode>(action)
}
