import { useCallback } from 'react'
import { syncEspnRoster } from '@/core/use-cases/syncEspnRoster'
import type { RosterSyncSummary } from '@/core/ports/SyncRepository'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: boton "Sincronizar plantillas". */
export function useSyncEspnRoster() {
  const repositories = useRepositories()
  const action = useCallback(() => syncEspnRoster(repositories), [repositories])
  return useAsyncAction<void, RosterSyncSummary>(action)
}
