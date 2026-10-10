import type { SupabaseClient } from '@supabase/supabase-js'
import type { PredictionsRepository } from '@/core/ports/PredictionsRepository'
import type { GamePrediction, PredictionSource } from '@/core/entities/gamePrediction'

interface GamePredictionRow {
  game_id: string
  source: PredictionSource
  // PostgREST serializa numeric como string o number según el valor.
  home_win_pct: number | string
  away_win_pct: number | string
  home_spread: number | string | null
  over_under: number | string | null
  fetched_at: string
}

function toNumberOrNull(value: number | string | null): number | null {
  return value === null ? null : Number(value)
}

export class SupabasePredictionsRepository implements PredictionsRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async listForGames(gameIds: string[]): Promise<Map<string, GamePrediction>> {
    const { data, error } = await this.client
      .from('game_predictions')
      .select('game_id, source, home_win_pct, away_win_pct, home_spread, over_under, fetched_at')
      .eq('source', 'espn_fpi')
      .in('game_id', gameIds)
    if (error) throw error
    return new Map(
      ((data ?? []) as GamePredictionRow[]).map((row) => [
        row.game_id,
        {
          gameId: row.game_id,
          source: row.source,
          homeWinPct: Number(row.home_win_pct),
          awayWinPct: Number(row.away_win_pct),
          homeSpread: toNumberOrNull(row.home_spread),
          overUnder: toNumberOrNull(row.over_under),
          fetchedAt: new Date(row.fetched_at),
        },
      ]),
    )
  }
}
