import { useCallback } from 'react'
import { getProfileWeeklyTrend } from '@/core/use-cases/getProfileWeeklyTrend'
import type { ProfileWeeklyTrendPoint } from '@/core/entities/achievement'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Aciertos por semana del usuario, para el grafico de tendencia del perfil. */
export function useGetProfileWeeklyTrend() {
  const repositories = useRepositories()
  const action = useCallback(() => getProfileWeeklyTrend(repositories), [repositories])
  return useAsyncAction<void, ProfileWeeklyTrendPoint[]>(action)
}
