import { describe, expect, it } from 'vitest'
import { pickDefaultWeek } from './pickDefaultWeek'
import type { Game, Week } from '@/core/entities/catalog'

function week(overrides: Partial<Week>): Week {
  return { id: 'w1', type: 'regular', number: 1, ...overrides }
}

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

describe('pickDefaultWeek', () => {
  it('picks the week whose games are currently in progress or upcoming', () => {
    const weeks = [week({ id: 'w1', number: 1 }), week({ id: 'w2', number: 2 })]
    const games = [
      game({ id: 'g1', weekId: 'w1', kickoffAt: new Date('2026-09-08T00:00:00Z') }),
      game({ id: 'g2', weekId: 'w2', kickoffAt: new Date('2026-09-15T00:00:00Z') }),
    ]
    const result = pickDefaultWeek(weeks, games, new Date('2026-09-16T00:00:00Z'))
    expect(result.id).toBe('w2')
  })

  it('prefers hof/pretemporada weeks over regular week 1 when they play first', () => {
    const weeks = [week({ id: 'hof', type: 'hof', number: 1 }), week({ id: 'w1', type: 'regular', number: 1 })]
    const games = [
      game({ id: 'g1', weekId: 'hof', kickoffAt: new Date('2026-08-01T00:00:00Z') }),
      game({ id: 'g2', weekId: 'w1', kickoffAt: new Date('2026-09-10T00:00:00Z') }),
    ]
    const result = pickDefaultWeek(weeks, games, new Date('2026-07-30T00:00:00Z'))
    expect(result.id).toBe('hof')
  })

  it('falls back to the last week with games once the season is over', () => {
    const weeks = [week({ id: 'w1', number: 1 }), week({ id: 'w2', number: 2 })]
    const games = [
      game({ id: 'g1', weekId: 'w1', kickoffAt: new Date('2026-09-08T00:00:00Z') }),
      game({ id: 'g2', weekId: 'w2', kickoffAt: new Date('2026-09-15T00:00:00Z') }),
    ]
    const result = pickDefaultWeek(weeks, games, new Date('2027-01-01T00:00:00Z'))
    expect(result.id).toBe('w2')
  })

  it('falls back to the earliest regular week when no games are loaded yet', () => {
    const weeks = [week({ id: 'w2', number: 2 }), week({ id: 'w1', number: 1 }), week({ id: 'hof', type: 'hof', number: 1 })]
    const result = pickDefaultWeek(weeks, [], new Date('2026-07-01T00:00:00Z'))
    expect(result.id).toBe('w1')
  })
})
