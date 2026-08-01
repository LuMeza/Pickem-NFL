import { useCallback } from 'react'
import {
  listSurvivorGroupState,
  type ListSurvivorGroupStateParams,
} from '@/core/use-cases/listSurvivorGroupState'
import type { SurvivorParticipant } from '@/core/entities/survivor'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Estado y roster de Survivor del grupo. */
export function useListSurvivorGroupState() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListSurvivorGroupStateParams) => listSurvivorGroupState(repositories, params),
    [repositories],
  )
  return useAsyncAction<ListSurvivorGroupStateParams, SurvivorParticipant[]>(action)
}
