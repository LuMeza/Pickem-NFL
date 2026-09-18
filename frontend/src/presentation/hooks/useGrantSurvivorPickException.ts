import { useCallback } from 'react'
import {
  grantSurvivorPickException,
  type GrantSurvivorPickExceptionParams,
} from '@/core/use-cases/grantSurvivorPickException'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: habilita el pick de Survivor de una semana ya cerrada para un usuario puntual. */
export function useGrantSurvivorPickException() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: GrantSurvivorPickExceptionParams) => grantSurvivorPickException(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
