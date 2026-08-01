import { useCallback } from 'react'
import { listUserAchievements } from '@/core/use-cases/listUserAchievements'
import type { ProfileAchievement } from '@/core/entities/achievement'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Catalogo de logros con estado desbloqueado/bloqueado del usuario actual. */
export function useListUserAchievements() {
  const repositories = useRepositories()
  const action = useCallback(() => listUserAchievements(repositories), [repositories])
  return useAsyncAction<void, ProfileAchievement[]>(action)
}
