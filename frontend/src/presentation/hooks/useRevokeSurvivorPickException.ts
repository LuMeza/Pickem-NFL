import { useCallback } from 'react'
import {
  revokeSurvivorPickException,
  type RevokeSurvivorPickExceptionParams,
} from '@/core/use-cases/revokeSurvivorPickException'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: revoca un acceso excepcional de pick de Survivor que el usuario todavía no usó. */
export function useRevokeSurvivorPickException() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: RevokeSurvivorPickExceptionParams) => revokeSurvivorPickException(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
