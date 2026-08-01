import type { RosterSyncSummary, SyncRepository } from '@/core/ports/SyncRepository'

export interface SyncEspnRosterDeps {
  syncRepository: SyncRepository
}

/** Panel admin: sincronizacion bajo demanda de las plantillas desde ESPN. */
export function syncEspnRoster(deps: SyncEspnRosterDeps): Promise<RosterSyncSummary> {
  return deps.syncRepository.syncEspnRoster()
}
