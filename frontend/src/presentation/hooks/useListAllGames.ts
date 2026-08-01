import { useCallback } from 'react'
import { listAllGames } from '@/core/use-cases/listAllGames'
import type { Game } from '@/core/entities/catalog'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Todos los partidos de la temporada, para la vista de calendario general. */
export function useListAllGames() {
  const repositories = useRepositories()
  const action = useCallback(() => listAllGames(repositories), [repositories])
  return useAsyncAction<void, Game[]>(action)
}
