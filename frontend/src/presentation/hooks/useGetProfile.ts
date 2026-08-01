import { useCallback } from 'react'
import { getProfile } from '@/core/use-cases/getProfile'
import type { Profile } from '@/core/entities/profile'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Perfil del usuario autenticado. */
export function useGetProfile() {
  const repositories = useRepositories()
  const action = useCallback(() => getProfile(repositories), [repositories])
  return useAsyncAction<void, Profile>(action)
}
