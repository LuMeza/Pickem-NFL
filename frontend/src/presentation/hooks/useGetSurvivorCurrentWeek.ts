import { useCallback } from 'react'
import { getSurvivorCurrentWeek } from '@/core/use-cases/getSurvivorCurrentWeek'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Numero de la semana regular actualmente abierta — ver design.md decision 8. */
export function useGetSurvivorCurrentWeek() {
  const repositories = useRepositories()
  const action = useCallback(() => getSurvivorCurrentWeek(repositories), [repositories])
  return useAsyncAction<void, number | null>(action)
}
