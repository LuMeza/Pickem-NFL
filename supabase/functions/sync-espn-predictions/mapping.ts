// Funciones puras de parseo del endpoint `summary` de ESPN — sin llamadas de
// red, para poder probarse aisladas (mismo patron que sync-espn-results).
//
// Solo se leen los porcentajes del "Matchup Predictor" y la línea de puntos
// (spread / over-under). Momios y proveedor de la línea se ignoran a
// propósito: el producto no muestra nada relacionado con apuestas.

export interface EspnPredictorTeam {
  id?: string
  gameProjection?: string | number
}

export interface EspnPickcenterTeamOdds {
  favorite?: boolean
}

export interface EspnPickcenterEntry {
  spread?: number
  overUnder?: number
  homeTeamOdds?: EspnPickcenterTeamOdds
  awayTeamOdds?: EspnPickcenterTeamOdds
}

export interface EspnSummaryResponse {
  predictor?: {
    homeTeam?: EspnPredictorTeam
    awayTeam?: EspnPredictorTeam
  }
  pickcenter?: EspnPickcenterEntry[]
}

export interface ParsedPrediction {
  homeWinPct: number
  awayWinPct: number
  /** Negativo = local favorito; null si ESPN no publica línea o es pick'em sin favorito. */
  homeSpread: number | null
  overUnder: number | null
}

function toPct(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null
  const pct = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return null
  return pct
}

function finiteOrNull(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Spread respecto al local, sin depender de la convención de signo de ESPN:
 * el favorito lo marca `favorite` en las odds de cada equipo y la magnitud
 * sale de `spread`. Sin favorito marcado (o spread 0) no hay línea útil.
 */
function normalizeHomeSpread(entry: EspnPickcenterEntry): number | null {
  const spread = finiteOrNull(entry.spread)
  if (spread === null || spread === 0) return null
  if (entry.homeTeamOdds?.favorite) return -Math.abs(spread)
  if (entry.awayTeamOdds?.favorite) return Math.abs(spread)
  return null
}

/** Pronóstico del partido, o null si ESPN no publica un predictor válido. */
export function parseEspnPrediction(body: EspnSummaryResponse): ParsedPrediction | null {
  const homeWinPct = toPct(body.predictor?.homeTeam?.gameProjection)
  const awayWinPct = toPct(body.predictor?.awayTeam?.gameProjection)
  if (homeWinPct === null || awayWinPct === null) return null

  const line = body.pickcenter?.[0]
  return {
    homeWinPct,
    awayWinPct,
    homeSpread: line ? normalizeHomeSpread(line) : null,
    overUnder: line ? finiteOrNull(line.overUnder) : null,
  }
}
