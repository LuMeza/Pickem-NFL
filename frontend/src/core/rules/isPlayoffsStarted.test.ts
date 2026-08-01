import { describe, expect, it } from 'vitest'
import { isPlayoffsStarted } from './isPlayoffsStarted'
import type { Game, Week } from '@/core/entities/catalog'

const regularWeek: Week = { id: 'w-regular', type: 'regular', number: 18 }
const playoffsWeek: Week = { id: 'w-playoffs', type: 'playoffs', number: 1 }

function game(overrides: Partial<Game>): Game {
  return {
    id: 'g1',
    weekId: playoffsWeek.id,
    homeTeamId: 'KC',
    awayTeamId: 'BUF',
    kickoffAt: new Date('2026-01-10T18:00:00Z'),
    ...overrides,
  }
}

describe('isPlayoffsStarted', () => {
  it('is false when no playoffs week has a game yet', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const result = isPlayoffsStarted([regularWeek, playoffsWeek], [], now)
    expect(result).toBe(false)
  })

  it('is false when the only playoffs game has not kicked off yet', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const games = [game({ kickoffAt: new Date('2026-01-10T18:00:00Z') })]
    expect(isPlayoffsStarted([regularWeek, playoffsWeek], games, now)).toBe(false)
  })

  it('is true exactly at kickoff of a playoffs game', () => {
    const kickoff = new Date('2026-01-10T18:00:00Z')
    const games = [game({ kickoffAt: kickoff })]
    expect(isPlayoffsStarted([regularWeek, playoffsWeek], games, kickoff)).toBe(true)
  })

  it('is true after a playoffs game has kicked off', () => {
    const now = new Date('2026-01-10T19:00:00Z')
    const games = [game({ kickoffAt: new Date('2026-01-10T18:00:00Z') })]
    expect(isPlayoffsStarted([regularWeek, playoffsWeek], games, now)).toBe(true)
  })

  it('ignores games from non-playoffs weeks that already kicked off', () => {
    const now = new Date('2026-01-10T19:00:00Z')
    const games = [game({ weekId: regularWeek.id, kickoffAt: new Date('2026-01-01T18:00:00Z') })]
    expect(isPlayoffsStarted([regularWeek, playoffsWeek], games, now)).toBe(false)
  })
})
