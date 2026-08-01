import { useCallback } from 'react'
import {
  listWeeklyPicksForWeek,
  type ListWeeklyPicksForWeekParams,
} from '@/core/use-cases/listWeeklyPicksForWeek'
import type { WeeklyPickValue } from '@/core/ports/WeeklyPickRepository'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Picks propios de una semana, indexados por game_id. */
export function useListWeeklyPicksForWeek() {
  const repositories = useRepositories()
  const action = useCallback(
    (params: ListWeeklyPicksForWeekParams) => listWeeklyPicksForWeek(repositories, params),
    [repositories],
  )
  return useAsyncAction<ListWeeklyPicksForWeekParams, Record<string, WeeklyPickValue>>(action)
}
