import { describe, expect, it } from 'vitest'
import { findWeeklyCelebrationWeek } from './findWeeklyCelebrationWeek'
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
    kickoffAt: new Date('2026-11-16T01:00:00Z'),
    livePeriod: null,
    liveClock: null,
    ...overrides,
  }
}

describe('findWeeklyCelebrationWeek', () => {
  it('returns the most recent week whose games already finished', () => {
    const weeks = [week({ id: 'w1', number: 1 }), week({ id: 'w2', number: 2 })]
    const games = [
      game({ id: 'g1', weekId: 'w1', kickoffAt: new Date('2026-11-09T18:00:00Z') }),
      game({ id: 'g2', weekId: 'w2', kickoffAt: new Date('2026-11-16T18:00:00Z') }),
    ]
    expect(findWeeklyCelebrationWeek(weeks, games, new Date('2026-11-17T12:00:00Z'))?.id).toBe('w2')
  })

  it('ignores a week that still has games in progress or ahead', () => {
    const weeks = [week({ id: 'w1', number: 1 }), week({ id: 'w2', number: 2 })]
    const games = [
      game({ id: 'g1', weekId: 'w1', kickoffAt: new Date('2026-11-12T18:00:00Z') }),
      game({ id: 'g2', weekId: 'w2', kickoffAt: new Date('2026-11-16T18:00:00Z') }),
      game({ id: 'g3', weekId: 'w2', kickoffAt: new Date('2026-11-17T01:15:00Z') }),
    ]
    // g3 todavía no cumple 4h desde el kickoff: la semana 2 no terminó.
    expect(findWeeklyCelebrationWeek(weeks, games, new Date('2026-11-17T03:00:00Z'))?.id).toBe('w1')
  })

  it('returns null when the last finished week is older than seven days', () => {
    const weeks = [week({ id: 'w1' })]
    const games = [game({ weekId: 'w1', kickoffAt: new Date('2026-11-01T18:00:00Z') })]
    expect(findWeeklyCelebrationWeek(weeks, games, new Date('2026-11-17T12:00:00Z'))).toBeNull()
  })

  it('skips hof and preseason weeks', () => {
    const weeks = [week({ id: 'hof', type: 'hof' }), week({ id: 'pre', type: 'pretemporada' })]
    const games = [
      game({ id: 'g1', weekId: 'hof', kickoffAt: new Date('2026-11-16T18:00:00Z') }),
      game({ id: 'g2', weekId: 'pre', kickoffAt: new Date('2026-11-16T18:00:00Z') }),
    ]
    expect(findWeeklyCelebrationWeek(weeks, games, new Date('2026-11-17T12:00:00Z'))).toBeNull()
  })

  it('returns null when no week has games', () => {
    expect(findWeeklyCelebrationWeek([week({})], [], new Date('2026-11-17T12:00:00Z'))).toBeNull()
  })
})
