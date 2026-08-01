import { useCallback } from 'react'
import { listMySurvivorPicks, type ListMySurvivorPicksParams } from '@/core/use-cases/listMySurvivorPicks'
import type { SurvivorPick } from '@/core/entities/survivor'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Elecciones propias de Survivor en la temporada (para excluir equipos usados e historial). */
export function useListMySurvivorPicks() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListMySurvivorPicksParams) => listMySurvivorPicks(repositories, params),
    [repositories],
  )
  return useAsyncAction<ListMySurvivorPicksParams, SurvivorPick[]>(action)
}
