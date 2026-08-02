export type GameOutcome = 'home' | 'away' | 'tie'

/** Ver openspec/changes/base-plataforma design.md — precedencia de la carga manual sobre la sincronización automatica. */
export type ResultSource = 'manual' | 'auto_sync'

export interface GameResult {
  gameId: string
  outcome: GameOutcome
  /** Marcador exacto, nullable — ver openspec/changes/base-plataforma design.md. */
  homeScore: number | null
  awayScore: number | null
  resultSource: ResultSource
}

/**
 * Lo que un administrador captura a mano en el panel — `resultSource` no se
 * pide porque una carga hecha desde este flujo siempre es 'manual'
 * (la sincronización automatica escribe por un camino aparte, ver
 * openspec/changes/integracion-resultados-espn).
 */
export type ManualGameResult = Omit<GameResult, 'resultSource'>

