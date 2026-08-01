import type { SyncRepository, SyncSummary } from '@/core/ports/SyncRepository'

export interface SyncWithEspnDeps {
  syncRepository: SyncRepository
}

/** Panel admin: sincronizacion bajo demanda con ESPN — ver openspec/changes/integracion-resultados-espn. */
export function syncWithEspn(deps: SyncWithEspnDeps): Promise<SyncSummary> {
  return deps.syncRepository.syncWithEspn()
}
