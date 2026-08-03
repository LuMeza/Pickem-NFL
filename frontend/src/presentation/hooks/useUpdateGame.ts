import { useCallback } from 'react'
import { updateGame, type UpdateGameParams } from '@/core/use-cases/updateGame'
import type { Game } from '@/core/entities/catalog'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: editar equipos/kickoff de un partido ya cargado. */
export function useUpdateGame() {
  const repositories = useRepositories()
  const action = useCallback((params: UpdateGameParams) => updateGame(repositories, params), [repositories])
  return useAsyncAction<UpdateGameParams, Game>(action)
}
