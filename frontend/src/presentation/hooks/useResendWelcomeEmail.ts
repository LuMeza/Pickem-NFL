import { useCallback } from 'react'
import { resendWelcomeEmail, type ResendWelcomeEmailParams } from '@/core/use-cases/resendWelcomeEmail'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: reenvía el correo de bienvenida a un usuario existente. */
export function useResendWelcomeEmail() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ResendWelcomeEmailParams) => resendWelcomeEmail(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
