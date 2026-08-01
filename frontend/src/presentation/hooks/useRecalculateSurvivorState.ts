import { useCallback } from 'react'
import {
  recalculateSurvivorState,
  type RecalculateSurvivorStateParams,
} from '@/core/use-cases/recalculateSurvivorState'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin, plan B: recalcular Survivor a mano. */
export function useRecalculateSurvivorState() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: RecalculateSurvivorStateParams) => recalculateSurvivorState(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
