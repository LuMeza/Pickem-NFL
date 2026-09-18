import { useCallback } from 'react'
import { getSurvivorPickException, type GetSurvivorPickExceptionParams } from '@/core/use-cases/getSurvivorPickException'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Pantalla de pick: si el usuario tiene un acceso excepcional activo para la semana que está viendo. */
export function useGetSurvivorPickException() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: GetSurvivorPickExceptionParams) => getSurvivorPickException(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
