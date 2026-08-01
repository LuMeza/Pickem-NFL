import { useCallback } from 'react'
import { requestSurvivorLife, type RequestSurvivorLifeParams } from '@/core/use-cases/requestSurvivorLife'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Pide la siguiente vida extra tras perder — ver design.md decision 7. */
export function useRequestSurvivorLife() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: RequestSurvivorLifeParams) => requestSurvivorLife(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
