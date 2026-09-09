import { useCallback } from 'react'
import {
  listAdminSurvivorPayments,
  type ListAdminSurvivorPaymentsParams,
} from '@/core/use-cases/listAdminSurvivorPayments'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: pago de cada vida de Survivor de todo el grupo. */
export function useListAdminSurvivorPayments() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListAdminSurvivorPaymentsParams) => listAdminSurvivorPayments(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
