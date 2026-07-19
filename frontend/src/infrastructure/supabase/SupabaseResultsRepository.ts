import type { SupabaseClient } from '@supabase/supabase-js'
import type { GameOutcome, GameResult } from '@/core/entities/gameResult'
import type { ResultsRepository } from '@/core/ports/ResultsRepository'

export class SupabaseResultsRepository implements ResultsRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async setResult(result: GameResult): Promise<void> {
    const { error } = await this.client
      .from('games')
      .update({
        outcome: result.outcome,
        home_score: result.homeScore,
        away_score: result.awayScore,
      })
      .eq('id', result.gameId)
    if (error) throw error
  }

  async getResult(gameId: string): Promise<GameResult | null> {
    const { data, error } = await this.client
      .from('games')
      .select('id, outcome, home_score, away_score')
      .eq('id', gameId)
      .single()
    if (error) throw error
    if (!data || data.outcome === null) return null

    return {
      gameId: data.id as string,
      outcome: data.outcome as GameOutcome,
      homeScore: data.home_score as number | null,
      awayScore: data.away_score as number | null,
    }
  }
}
