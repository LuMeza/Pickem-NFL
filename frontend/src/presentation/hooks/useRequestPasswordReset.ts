import { useCallback } from 'react'
import { requestPasswordReset, type RequestPasswordResetParams } from '@/core/use-cases/requestPasswordReset'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Pantalla "Olvide mi contraseña". */
export function useRequestPasswordReset() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: RequestPasswordResetParams) => requestPasswordReset(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
