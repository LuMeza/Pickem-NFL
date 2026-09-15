import { useCallback } from 'react'
import {
  listAdminSurvivorWithdrawals,
  type ListAdminSurvivorWithdrawalsParams,
} from '@/core/use-cases/listAdminSurvivorWithdrawals'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: quienes fueron retirados del pool de Survivor en todo el grupo. */
export function useListAdminSurvivorWithdrawals() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListAdminSurvivorWithdrawalsParams) => listAdminSurvivorWithdrawals(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
