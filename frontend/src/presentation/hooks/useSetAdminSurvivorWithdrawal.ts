import { useCallback } from 'react'
import {
  setAdminSurvivorWithdrawal,
  type SetAdminSurvivorWithdrawalParams,
} from '@/core/use-cases/setAdminSurvivorWithdrawal'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: retira (o reincorpora) a un usuario del pool de Survivor. */
export function useSetAdminSurvivorWithdrawal() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: SetAdminSurvivorWithdrawalParams) => setAdminSurvivorWithdrawal(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
