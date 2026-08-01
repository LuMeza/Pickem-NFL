import { useCallback } from 'react'
import {
  getPickemTablesVisibility,
  type GetPickemTablesVisibilityParams,
} from '@/core/use-cases/getPickemTablesVisibility'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: valor actual del flag de visibilidad de tablas. */
export function useGetPickemTablesVisibility() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: GetPickemTablesVisibilityParams) => getPickemTablesVisibility(repositories, params),
    [repositories],
  )
  return useAsyncAction<GetPickemTablesVisibilityParams, boolean>(action)
}
