import type { GameResult } from '@/core/entities/gameResult'

/** Ver openspec/changes/base-plataforma specs/carga-resultados. Escritura exclusiva del administrador de plataforma (impuesta por RLS). */
export interface ResultsRepository {
  setResult(result: GameResult): Promise<void>
  getResult(gameId: string): Promise<GameResult | null>
}
