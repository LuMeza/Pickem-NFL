import { useCallback } from 'react'
import {
  listAdminWeeklyPayments,
  type ListAdminWeeklyPaymentsParams,
} from '@/core/use-cases/listAdminWeeklyPayments'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: quien ya pago la apuesta del pickem semanal, para una semana. */
export function useListAdminWeeklyPayments() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListAdminWeeklyPaymentsParams) => listAdminWeeklyPayments(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
