import type { PredictionGame } from '@/core/entities/game'
import type { GameResult } from '@/core/entities/gameResult'

export type GameLiveStatus = 'scheduled' | 'live' | 'final'

/** Ventana desde el kickoff en la que, sin resultado cargado todavía, tratamos el partido como "en vivo". Un partido de NFL dura ~3h en cancha. */
const LIVE_WINDOW_MS = 4 * 60 * 60 * 1000

/**
 * Regla compartida entre Pickem Semanal, Calendario y Home (antes vivía solo en GamesPage).
 * No hay estado real de "en vivo" del proveedor de datos — se infiere por tiempo desde el kickoff.
 */
export function getGameLiveStatus(game: PredictionGame, result: GameResult | null, now: Date): GameLiveStatus {
  const hasResult = result != null && result.homeScore !== null && result.awayScore !== null
  if (hasResult) return 'final'

  const msSinceKickoff = now.getTime() - game.kickoffAt.getTime()
  if (msSinceKickoff >= 0 && msSinceKickoff < LIVE_WINDOW_MS) return 'live'
  return 'scheduled'
}
