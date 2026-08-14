import { useCallback } from 'react'
import { listWeeklyPicksBoard, type ListWeeklyPicksBoardParams } from '@/core/use-cases/listWeeklyPicksBoard'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Picks de todos los usuarios del grupo en pickem semanal, para una semana ya bloqueada. */
export function useListWeeklyPicksBoard() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListWeeklyPicksBoardParams) => listWeeklyPicksBoard(repositories, params),
    [repositories],
  )
  return useAsyncAction(action)
}
