import { useCallback } from 'react'
import { getProfileStats } from '@/core/use-cases/getProfileStats'
import type { ProfilePickemSummary } from '@/core/entities/achievement'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Resumen de aciertos del usuario para el header "stat card" del perfil. */
export function useGetProfileStats() {
  const repositories = useRepositories()
  const action = useCallback(() => getProfileStats(repositories), [repositories])
  return useAsyncAction<void, ProfilePickemSummary>(action)
}
