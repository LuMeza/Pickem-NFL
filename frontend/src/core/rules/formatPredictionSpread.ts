export interface PredictionFavorite {
  favorite: 'home' | 'away'
  points: number
}

/** Favorito y por cuántos puntos a partir del spread del local (negativo = local favorito); null si no hay línea. */
export function formatPredictionSpread(homeSpread: number | null): PredictionFavorite | null {
  if (homeSpread === null || homeSpread === 0) return null
  return { favorite: homeSpread < 0 ? 'home' : 'away', points: Math.abs(homeSpread) }
}
