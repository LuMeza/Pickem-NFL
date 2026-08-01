import { useCallback } from 'react'
import { canViewPickemTables, type CanViewPickemTablesParams } from '@/core/use-cases/canViewPickemTables'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Visibilidad de las tablas de posiciones del pickem semanal para el usuario actual. */
export function useCanViewPickemTables() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: CanViewPickemTablesParams) => canViewPickemTables(repositories, params),
    [repositories],
  )
  return useAsyncAction<CanViewPickemTablesParams, boolean>(action)
}
