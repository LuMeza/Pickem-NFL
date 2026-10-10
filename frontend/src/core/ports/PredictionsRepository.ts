import type { GamePrediction } from '@/core/entities/gamePrediction'

/**
 * Pronósticos por partido — ver openspec/changes/espn-game-predictions.
 * La visibilidad por grupo la impone RLS (can_view_game_prediction): un
 * partido cuyo pronóstico no le toca ver al usuario simplemente no aparece.
 */
export interface PredictionsRepository {
  listForGames(gameIds: string[]): Promise<Map<string, GamePrediction>>
}
