import { describe, expect, it } from 'vitest'
import { isWeekAccessLocked } from './isWeekAccessLocked'
import type { Game } from '@/core/entities/catalog'

function game(overrides: Partial<Game>): Game {
  return {
    id: 'g1',
    weekId: 'w1',
    homeTeamId: 'KC',
    awayTeamId: 'BUF',
    kickoffAt: new Date('2026-09-10T20:00:00Z'),
    ...overrides,
  }
}

describe('isWeekAccessLocked', () => {
  it('is false when the week has no games yet', () => {
    expect(isWeekAccessLocked([], new Date('2026-09-01T00:00:00Z'))).toBe(false)
  })

  it('is false before the earliest kickoff of the week', () => {
    const games = [game({ kickoffAt: new Date('2026-09-10T20:00:00Z') }), game({ id: 'g2', kickoffAt: new Date('2026-09-11T00:00:00Z') })]
    expect(isWeekAccessLocked(games, new Date('2026-09-10T19:59:59Z'))).toBe(false)
  })

  it('is true exactly at the earliest kickoff of the week', () => {
    const kickoff = new Date('2026-09-10T20:00:00Z')
    const games = [game({ kickoffAt: kickoff }), game({ id: 'g2', kickoffAt: new Date('2026-09-11T00:00:00Z') })]
    expect(isWeekAccessLocked(games, kickoff)).toBe(true)
  })

  it('is true after the earliest kickoff of the week', () => {
    const games = [game({ kickoffAt: new Date('2026-09-10T20:00:00Z') })]
    expect(isWeekAccessLocked(games, new Date('2026-09-10T20:00:01Z'))).toBe(true)
  })
})
