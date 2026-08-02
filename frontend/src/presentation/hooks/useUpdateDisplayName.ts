import { useCallback } from 'react'
import { updateDisplayName, type UpdateDisplayNameParams } from '@/core/use-cases/updateDisplayName'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Pantalla de edición de perfil: nombre visible. */
export function useUpdateDisplayName() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: UpdateDisplayNameParams) => updateDisplayName(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
