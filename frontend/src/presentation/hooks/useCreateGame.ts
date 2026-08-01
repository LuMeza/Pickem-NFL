import { useCallback } from 'react'
import { createGame } from '@/core/use-cases/createGame'
import type { NewGame } from '@/core/ports/CatalogRepository'
import type { Game } from '@/core/entities/catalog'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: agregar un partido al calendario. */
export function useCreateGame() {
  const repositories = useRepositories()
  const action = useCallback((game: NewGame) => createGame(repositories, game), [repositories])
  return useAsyncAction<NewGame, Game>(action)
}
