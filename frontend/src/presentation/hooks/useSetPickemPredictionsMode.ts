import { useCallback } from 'react'
import {
  setPickemPredictionsMode,
  type SetPickemPredictionsModeParams,
} from '@/core/use-cases/setPickemPredictionsMode'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: cambiar el modo de visibilidad de pronósticos. */
export function useSetPickemPredictionsMode() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: SetPickemPredictionsModeParams) => setPickemPredictionsMode(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
