import { describe, expect, it } from 'vitest'
import { parseEspnPrediction, type EspnSummaryResponse } from './mapping'

// Recorte real de summary?event=401872981 (PHI @ JAX), 2026-10-09.
const phiAtJax: EspnSummaryResponse = {
  predictor: {
    homeTeam: { id: '30', gameProjection: '73.6' },
    awayTeam: { id: '21', gameProjection: '26.2' },
  },
  pickcenter: [
    {
      spread: -7.5,
      overUnder: 41.5,
      homeTeamOdds: { favorite: true },
      awayTeamOdds: { favorite: false },
    },
  ],
}

describe('parseEspnPrediction', () => {
  it('lee porcentajes, spread del local favorito y over/under', () => {
    expect(parseEspnPrediction(phiAtJax)).toEqual({
      homeWinPct: 73.6,
      awayWinPct: 26.2,
      homeSpread: -7.5,
      overUnder: 41.5,
    })
  })

  it('con el visitante favorito el spread del local es positivo, sin importar el signo de ESPN', () => {
    const body: EspnSummaryResponse = {
      ...phiAtJax,
      pickcenter: [{ spread: -3, overUnder: 44, homeTeamOdds: { favorite: false }, awayTeamOdds: { favorite: true } }],
    }
    expect(parseEspnPrediction(body)?.homeSpread).toBe(3)
  })

  it('sin pickcenter guarda los porcentajes y deja la línea vacía', () => {
    expect(parseEspnPrediction({ predictor: phiAtJax.predictor })).toEqual({
      homeWinPct: 73.6,
      awayWinPct: 26.2,
      homeSpread: null,
      overUnder: null,
    })
  })

  it('sin favorito marcado o spread 0 no hay spread', () => {
    const body: EspnSummaryResponse = {
      ...phiAtJax,
      pickcenter: [{ spread: 0, overUnder: 40, homeTeamOdds: { favorite: false }, awayTeamOdds: { favorite: false } }],
    }
    expect(parseEspnPrediction(body)?.homeSpread).toBeNull()
    expect(parseEspnPrediction(body)?.overUnder).toBe(40)
  })

  it('sin predictor devuelve null', () => {
    expect(parseEspnPrediction({ pickcenter: phiAtJax.pickcenter })).toBeNull()
  })

  it('porcentajes no numéricos o fuera de rango devuelven null', () => {
    expect(
      parseEspnPrediction({ predictor: { homeTeam: { gameProjection: 'N/A' }, awayTeam: { gameProjection: '26.2' } } }),
    ).toBeNull()
    expect(
      parseEspnPrediction({ predictor: { homeTeam: { gameProjection: '130' }, awayTeam: { gameProjection: '26.2' } } }),
    ).toBeNull()
  })
})
