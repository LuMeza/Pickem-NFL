import { useCallback } from 'react'
import { listPlayoffPicksForWeek, type ListPlayoffPicksForWeekParams } from '@/core/use-cases/listPlayoffPicksForWeek'
import type { PlayoffPickValue } from '@/core/ports/PlayoffsRepository'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Picks propios de una ronda de playoffs, indexados por game_id. */
export function useListPlayoffPicksForWeek() {
  const repositories = useRepositories()
  const action = useCallback((params: ListPlayoffPicksForWeekParams) => listPlayoffPicksForWeek(repositories, params), [repositories])
  return useAsyncAction<ListPlayoffPicksForWeekParams, Record<string, PlayoffPickValue>>(action)
}
