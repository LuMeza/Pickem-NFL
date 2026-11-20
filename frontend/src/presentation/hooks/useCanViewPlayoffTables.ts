import { useCallback } from 'react'
import { canViewPlayoffTables, type CanViewPlayoffTablesParams } from '@/core/use-cases/canViewPlayoffTables'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Visibilidad de las tablas de playoffs para el usuario actual. */
export function useCanViewPlayoffTables() {
  const repositories = useRepositories()
  const action = useCallback((params: CanViewPlayoffTablesParams) => canViewPlayoffTables(repositories, params), [repositories])
  return useAsyncAction<CanViewPlayoffTablesParams, boolean>(action)
}
