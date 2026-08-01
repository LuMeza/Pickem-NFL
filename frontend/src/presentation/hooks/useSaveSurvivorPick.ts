import { useCallback } from 'react'
import { saveSurvivorPick } from '@/core/use-cases/saveSurvivorPick'
import type { SaveSurvivorPickParams } from '@/core/ports/SurvivorRepository'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Elegir/editar el equipo de la semana en Survivor. */
export function useSaveSurvivorPick() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: SaveSurvivorPickParams) => saveSurvivorPick(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
