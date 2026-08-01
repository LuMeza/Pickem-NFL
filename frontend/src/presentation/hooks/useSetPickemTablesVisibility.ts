import { useCallback } from 'react'
import {
  setPickemTablesVisibility,
  type SetPickemTablesVisibilityParams,
} from '@/core/use-cases/setPickemTablesVisibility'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: habilitar/deshabilitar visibilidad de tablas para usuarios sin acceso. */
export function useSetPickemTablesVisibility() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: SetPickemTablesVisibilityParams) => setPickemTablesVisibility(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
