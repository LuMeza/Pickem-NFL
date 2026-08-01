import { useCallback } from 'react'
import { saveWeeklyPick } from '@/core/use-cases/saveWeeklyPick'
import type { SaveWeeklyPickParams } from '@/core/ports/WeeklyPickRepository'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Registrar/editar una prediccion del pickem semanal. */
export function useSaveWeeklyPick() {
  const repositories = useRepositories()
  const action = useCallback((params: SaveWeeklyPickParams) => saveWeeklyPick(repositories, params), [repositories])
  return useAsyncAction(action)
}
