export interface SyncSummary {
  weeksProcessed: number
  gamesCreated: number
  resultsUpdated: number
  errors: string[]
}

export interface RosterSyncSummary {
  teamsProcessed: number
  playersSynced: number
  errors: string[]
}

/**
 * Ver openspec/changes/integracion-resultados-espn. Invoca las Edge Functions
 * `sync-espn-results` y `sync-espn-roster` (unica pieza del sistema que llama
 * a ESPN — nunca desde el cliente directamente).
 */
export interface SyncRepository {
  syncWithEspn(): Promise<SyncSummary>
  syncEspnRoster(): Promise<RosterSyncSummary>
}
