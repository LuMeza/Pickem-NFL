import { useCallback } from 'react'
import { syncWithEspn } from '@/core/use-cases/syncWithEspn'
import type { SyncSummary } from '@/core/ports/SyncRepository'
import { useRepositories } from './RepositoriesContext'
import { useAsyncAction } from './useAsyncAction'

/** Panel admin: boton "Sincronizar con ESPN". */
export function useSyncWithEspn() {
  const repositories = useRepositories()
  const action = useCallback(() => syncWithEspn(repositories), [repositories])
  return useAsyncAction<void, SyncSummary>(action)
}
