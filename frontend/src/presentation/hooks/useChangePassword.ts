import { useCallback } from 'react'
import { changePassword, type ChangePasswordParams } from '@/core/use-cases/changePassword'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Pantalla obligatoria de cambio de contrasena en el primer login. */
export function useChangePassword() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ChangePasswordParams) => changePassword(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
