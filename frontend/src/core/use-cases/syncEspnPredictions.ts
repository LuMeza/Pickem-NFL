import type { PredictionSyncSummary, SyncRepository } from '@/core/ports/SyncRepository'

export interface SyncEspnPredictionsDeps {
  syncRepository: SyncRepository
}

/** Panel admin: sincronización bajo demanda de los pronósticos de partidos próximos desde ESPN. */
export function syncEspnPredictions(deps: SyncEspnPredictionsDeps): Promise<PredictionSyncSummary> {
  return deps.syncRepository.syncEspnPredictions()
}
