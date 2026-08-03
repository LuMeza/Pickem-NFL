import { describe, expect, it } from 'vitest'
import { getGameLiveStatus } from './getGameLiveStatus'
import type { GameResult } from '@/core/entities/gameResult'

describe('getGameLiveStatus', () => {
  const kickoffAt = new Date('2026-09-10T20:00:00Z')
  const game = { kickoffAt }
  const finishedResult: GameResult = {
    gameId: 'g1',
    outcome: 'home',
    homeScore: 24,
    awayScore: 17,
    resultSource: 'auto_sync',
  }
  const pendingResult: GameResult = {
    gameId: 'g1',
    outcome: 'home',
    homeScore: null,
    awayScore: null,
    resultSource: 'manual',
  }

  it('es scheduled antes del kickoff', () => {
    const now = new Date('2026-09-10T19:00:00Z')
    expect(getGameLiveStatus(game, null, now)).toBe('scheduled')
  })

  it('es live justo al kickoff sin resultado', () => {
    expect(getGameLiveStatus(game, null, kickoffAt)).toBe('live')
  })

  it('es live dentro de la ventana de 4h sin resultado cargado', () => {
    const now = new Date('2026-09-10T22:00:00Z')
    expect(getGameLiveStatus(game, null, now)).toBe('live')
  })

  it('vuelve a scheduled pasada la ventana de 4h si nunca llego resultado', () => {
    const now = new Date('2026-09-11T01:00:01Z')
    expect(getGameLiveStatus(game, null, now)).toBe('scheduled')
  })

  it('es final en cuanto hay marcador cargado, incluso dentro de la ventana live', () => {
    const now = new Date('2026-09-10T21:00:00Z')
    expect(getGameLiveStatus(game, finishedResult, now)).toBe('final')
  })

  it('no cuenta como final un resultado sin marcador (home/awayScore null)', () => {
    const now = new Date('2026-09-10T21:00:00Z')
    expect(getGameLiveStatus(game, pendingResult, now)).toBe('live')
  })
})
