import { useCallback } from 'react'
import { setAdminSurvivorPayment, type SetAdminSurvivorPaymentParams } from '@/core/use-cases/setAdminSurvivorPayment'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: marca o desmarca el pago de una vida de Survivor de un usuario. */
export function useSetAdminSurvivorPayment() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: SetAdminSurvivorPaymentParams) => setAdminSurvivorPayment(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
