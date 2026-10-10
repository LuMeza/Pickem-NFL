/** Fuente del pronóstico — fase 2 agrega un modelo Elo propio (ver openspec/changes/espn-game-predictions). */
export type PredictionSource = 'espn_fpi'

/** Modo de visibilidad de pronósticos por grupo (pickem_settings.predictions_mode). */
export type PredictionsMode = 'off' | 'after_lock' | 'always'

/** Pronóstico de victoria de un partido, congelado al kickoff. */
export interface GamePrediction {
  gameId: string
  source: PredictionSource
  /** Porcentajes 0-100; no suman exactamente 100 (el resto es la probabilidad de empate). */
  homeWinPct: number
  awayWinPct: number
  /** Línea de puntos respecto al local: negativo = local favorito. */
  homeSpread: number | null
  overUnder: number | null
  fetchedAt: Date
}
