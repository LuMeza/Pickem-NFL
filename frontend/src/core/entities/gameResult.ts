export type GameOutcome = 'home' | 'away' | 'tie'

export interface GameResult {
  gameId: string
  outcome: GameOutcome
  /** Marcador exacto, nullable — ver openspec/changes/base-plataforma design.md. */
  homeScore: number | null
  awayScore: number | null
}
