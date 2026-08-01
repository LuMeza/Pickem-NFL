import { useCallback } from 'react'
import { requestWeeklyAccess, type RequestWeeklyAccessParams } from '@/core/use-cases/requestWeeklyAccess'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Solicitud de acceso al pickem de una semana puntual. */
export function useRequestWeeklyAccess() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: RequestWeeklyAccessParams) => requestWeeklyAccess(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
