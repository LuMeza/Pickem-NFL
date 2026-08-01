import { useCallback } from 'react'
import { getGameResult, type GetGameResultParams } from '@/core/use-cases/getGameResult'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Consulta de resultado de un partido (lectura). */
export function useGetGameResult() {
  const repositories = useRepositories()
  const action = useCallback((params: GetGameResultParams) => getGameResult(repositories, params), [repositories])
  return useAsyncAction(action)
}
