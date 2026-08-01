import type { SupabaseClient } from '@supabase/supabase-js'
import type { RosterSyncSummary, SyncRepository, SyncSummary } from '@/core/ports/SyncRepository'

export class SupabaseSyncRepository implements SyncRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async syncWithEspn(): Promise<SyncSummary> {
    const { data, error } = await this.client.functions.invoke<SyncSummary>('sync-espn-results', { method: 'POST' })
    if (error || !data) {
      throw new Error(`No se pudo sincronizar con ESPN: ${error?.message ?? 'respuesta vacia'}`)
    }
    return data
  }

  async syncEspnRoster(): Promise<RosterSyncSummary> {
    const { data, error } = await this.client.functions.invoke<RosterSyncSummary>('sync-espn-roster', {
      method: 'POST',
    })
    if (error || !data) {
      throw new Error(`No se pudo sincronizar la plantilla: ${error?.message ?? 'respuesta vacia'}`)
    }
    return data
  }
}
