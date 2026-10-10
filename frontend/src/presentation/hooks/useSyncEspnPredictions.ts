import { useCallback } from 'react'
import { syncEspnPredictions } from '@/core/use-cases/syncEspnPredictions'
import type { PredictionSyncSummary } from '@/core/ports/SyncRepository'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: boton "Sincronizar pronósticos". */
export function useSyncEspnPredictions() {
  const repositories = useRepositories()
  const action = useCallback(() => syncEspnPredictions(repositories), [repositories])
  return useAsyncAction<void, PredictionSyncSummary>(action)
}
