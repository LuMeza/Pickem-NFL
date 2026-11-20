import { useCallback } from 'react'
import { savePlayoffPick } from '@/core/use-cases/savePlayoffPick'
import type { SavePlayoffPickParams } from '@/core/ports/PlayoffsRepository'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Registrar/editar una predicción de playoffs. */
export function useSavePlayoffPick() {
  const repositories = useRepositories()
  const action = useCallback((params: SavePlayoffPickParams) => savePlayoffPick(repositories, params), [repositories])
  return useAsyncAction<SavePlayoffPickParams, void>(action)
}
