import { useCallback } from 'react'
import {
  getWeeklyAccessStatus,
  type GetWeeklyAccessStatusParams,
} from '@/core/use-cases/getWeeklyAccessStatus'
import type { WeeklyAccessStatus } from '@/core/ports/WeeklyAccessRepository'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Estado de acceso propio al pickem de una semana (badge en RequestWeeklyAccessPage). */
export function useGetWeeklyAccessStatus() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: GetWeeklyAccessStatusParams) => getWeeklyAccessStatus(repositories, params),
    [repositories],
  )
  return useAsyncAction<GetWeeklyAccessStatusParams, WeeklyAccessStatus | null>(action)
}
