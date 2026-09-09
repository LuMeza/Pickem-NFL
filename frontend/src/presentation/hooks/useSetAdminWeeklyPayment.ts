import { useCallback } from 'react'
import { setAdminWeeklyPayment, type SetAdminWeeklyPaymentParams } from '@/core/use-cases/setAdminWeeklyPayment'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: marca o desmarca el pago de la apuesta semanal de un usuario. */
export function useSetAdminWeeklyPayment() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: SetAdminWeeklyPaymentParams) => setAdminWeeklyPayment(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
