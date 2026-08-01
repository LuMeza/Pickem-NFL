import { describe, expect, it } from 'vitest'
import {
  classifyOutcome,
  espnParamsForWeek,
  nflSeasonYear,
  parseEspnEvent,
  type EspnEvent,
  type InternalWeek,
} from './mapping'

describe('nflSeasonYear', () => {
  it('mid-season/offseason months (Jul) resolve to the current calendar year', () => {
    expect(nflSeasonYear(new Date('2026-07-18T00:00:00Z'))).toBe(2026)
  })

  it('season start (Sep) resolves to the current calendar year', () => {
    expect(nflSeasonYear(new Date('2026-09-10T00:00:00Z'))).toBe(2026)
  })

  it('January (playoffs tail) resolves to the previous calendar year season', () => {
    expect(nflSeasonYear(new Date('2027-01-15T00:00:00Z'))).toBe(2026)
  })

  it('February (Super Bowl) resolves to the previous calendar year season', () => {
    expect(nflSeasonYear(new Date('2027-02-08T00:00:00Z'))).toBe(2026)
  })

  it('March (new offseason) resolves to the new calendar year', () => {
    expect(nflSeasonYear(new Date('2027-03-01T00:00:00Z'))).toBe(2027)
  })
})

describe('espnParamsForWeek', () => {
  it('maps hof to ESPN preseason week 1 (Hall of Fame Game)', () => {
    const week: InternalWeek = { id: 'w0', type: 'hof', number: 1 }
    expect(espnParamsForWeek(week)).toEqual({ seasontype: 1, week: 1 })
  })

  it('offsets pretemporada by +1 (ESPN week 1 is Hall of Fame Game)', () => {
    const week: InternalWeek = { id: 'w1', type: 'pretemporada', number: 1 }
    expect(espnParamsForWeek(week)).toEqual({ seasontype: 1, week: 2 })
  })

  it('maps regular season 1:1', () => {
    const week: InternalWeek = { id: 'w1', type: 'regular', number: 7 }
    expect(espnParamsForWeek(week)).toEqual({ seasontype: 2, week: 7 })
  })

  it('maps playoffs Super Bowl (internal 4) to ESPN week 5', () => {
    const week: InternalWeek = { id: 'w1', type: 'playoffs', number: 4 }
    expect(espnParamsForWeek(week)).toEqual({ seasontype: 3, week: 5 })
  })

  it('maps playoffs Wild Card (internal 1) to ESPN week 1', () => {
    const week: InternalWeek = { id: 'w1', type: 'playoffs', number: 1 }
    expect(espnParamsForWeek(week)).toEqual({ seasontype: 3, week: 1 })
  })
})

describe('classifyOutcome', () => {
  it('home wins with higher score', () => {
    expect(classifyOutcome(24, 20)).toBe('home')
  })
  it('away wins with higher score', () => {
    expect(classifyOutcome(10, 17)).toBe('away')
  })
  it('tie with equal scores', () => {
    expect(classifyOutcome(20, 20)).toBe('tie')
  })
})

function buildEvent(overrides: Partial<EspnEvent> = {}): EspnEvent {
  return {
    id: '401772510',
    date: '2025-09-05T00:20Z',
    status: { type: { completed: true } },
    competitions: [
      {
        competitors: [
          { team: { abbreviation: 'PHI' }, homeAway: 'home', score: '24' },
          { team: { abbreviation: 'DAL' }, homeAway: 'away', score: '20' },
        ],
      },
    ],
    ...overrides,
  }
}

describe('parseEspnEvent', () => {
  it('parses a completed event with scores', () => {
    const result = parseEspnEvent(buildEvent())
    expect(result).toMatchObject({
      espnEventId: '401772510',
      homeAbbreviation: 'PHI',
      awayAbbreviation: 'DAL',
      completed: true,
      homeScore: 24,
      awayScore: 20,
    })
  })

  it('returns null scores for a scheduled (not yet played) event', () => {
    const event = buildEvent({ status: { type: { completed: false } } })
    const result = parseEspnEvent(event)
    expect(result?.completed).toBe(false)
    expect(result?.homeScore).toBeNull()
    expect(result?.awayScore).toBeNull()
  })

  it('returns null when a matchup is not yet decided (TBD)', () => {
    const event = buildEvent({
      competitions: [
        {
          competitors: [
            { team: { abbreviation: 'TBD' }, homeAway: 'home' },
            { team: { abbreviation: 'TBD' }, homeAway: 'away' },
          ],
        },
      ],
    })
    expect(parseEspnEvent(event)).toBeNull()
  })

  it('returns null when a competitor is missing entirely', () => {
    const event = buildEvent({
      competitions: [{ competitors: [{ team: { abbreviation: 'PHI' }, homeAway: 'home', score: '24' }] }],
    })
    expect(parseEspnEvent(event)).toBeNull()
  })
})
