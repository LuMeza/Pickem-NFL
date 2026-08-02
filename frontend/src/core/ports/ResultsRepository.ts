import type { GameResult, ManualGameResult } from '@/core/entities/gameResult'

/**
 * Ver openspec/changes/base-plataforma specs/carga-resultados. Escritura
 * exclusiva del administrador de plataforma (impuesta por RLS). `setResult`
 * siempre escribe con `result_source = 'manual'` y tiene precedencia
 * permanente sobre cualquier sincronización automatica futura.
 */
export interface ResultsRepository {
  setResult(result: ManualGameResult): Promise<void>
  getResult(gameId: string): Promise<GameResult | null>
}
