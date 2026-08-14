import { describe, expect, it } from 'vitest'
import { isWeeklyPickLocked, weeklyPickGroupDeadline } from './weeklyPickGroupDeadline'
import type { Game } from '@/core/entities/catalog'

function game(overrides: Partial<Game>): Game {
  return {
    id: 'g1',
    weekId: 'w1',
    homeTeamId: 'KC',
    awayTeamId: 'BUF',
    kickoffAt: new Date('2026-09-10T20:00:00Z'),
    livePeriod: null,
    liveClock: null,
    ...overrides,
  }
}

// Jueves 2026-09-10, 20:00 ET.
const thursdayKickoff = new Date('2026-09-11T00:00:00Z')
// Viernes 2026-09-11, 20:00 ET.
const fridayKickoff = new Date('2026-09-12T00:00:00Z')
// Domingo 2026-09-13, 13:00 ET.
const sundayKickoff = new Date('2026-09-13T17:00:00Z')
// Lunes 2026-09-14, 20:15 ET — cruza medianoche UTC (ya es martes en UTC) pero sigue siendo lunes en ET.
const mondayNightKickoff = new Date('2026-09-15T00:15:00Z')

describe('weeklyPickGroupDeadline', () => {
  it('cada dia cierra en su propio kickoff mas temprano, sin compartirlo con otros dias', () => {
    const games = [
      game({ id: 'thu', kickoffAt: thursdayKickoff }),
      game({ id: 'fri', kickoffAt: fridayKickoff }),
      game({ id: 'sun', kickoffAt: sundayKickoff }),
    ]
    expect(weeklyPickGroupDeadline(games, thursdayKickoff)).toEqual(thursdayKickoff)
    expect(weeklyPickGroupDeadline(games, fridayKickoff)).toEqual(fridayKickoff)
    expect(weeklyPickGroupDeadline(games, sundayKickoff)).toEqual(sundayKickoff)
  })

  it('agrupa el lunes con el domingo: cierra en el kickoff del primer partido de domingo', () => {
    const games = [game({ id: 'sun', kickoffAt: sundayKickoff }), game({ id: 'mon', kickoffAt: mondayNightKickoff })]
    expect(weeklyPickGroupDeadline(games, mondayNightKickoff)).toEqual(sundayKickoff)
  })

  it('si el lunes es el unico partido de domingo/lunes en la semana, cierra con su propio kickoff', () => {
    const games = [game({ id: 'mon', kickoffAt: mondayNightKickoff })]
    expect(weeklyPickGroupDeadline(games, mondayNightKickoff)).toEqual(mondayNightKickoff)
  })

  it('clasifica un Monday Night que cruza medianoche UTC como lunes, no como martes', () => {
    const games = [game({ id: 'mon', kickoffAt: mondayNightKickoff })]
    expect(weeklyPickGroupDeadline(games, mondayNightKickoff)).toEqual(mondayNightKickoff)
  })

  it('devuelve null si no hay partidos ese dia', () => {
    const games = [game({ id: 'thu', kickoffAt: thursdayKickoff })]
    expect(weeklyPickGroupDeadline(games, sundayKickoff)).toBeNull()
  })
})

describe('isWeeklyPickLocked', () => {
  const games = [
    game({ id: 'thu', kickoffAt: thursdayKickoff }),
    game({ id: 'fri', kickoffAt: fridayKickoff }),
    game({ id: 'sun', kickoffAt: sundayKickoff }),
  ]

  it('no bloquea un dia antes de su propio kickoff mas temprano', () => {
    const thuGame = game({ id: 'thu', kickoffAt: thursdayKickoff })
    expect(isWeeklyPickLocked(games, thuGame, new Date('2026-09-10T23:59:59Z'))).toBe(false)
  })

  it('bloquea el jueves en su propio kickoff, sin afectar al viernes ni al domingo', () => {
    const thuGame = game({ id: 'thu', kickoffAt: thursdayKickoff })
    const friGame = game({ id: 'fri', kickoffAt: fridayKickoff })
    const sunGame = game({ id: 'sun', kickoffAt: sundayKickoff })
    const justAfterThursday = new Date('2026-09-11T00:00:01Z')
    expect(isWeeklyPickLocked(games, thuGame, justAfterThursday)).toBe(true)
    expect(isWeeklyPickLocked(games, friGame, justAfterThursday)).toBe(false)
    expect(isWeeklyPickLocked(games, sunGame, justAfterThursday)).toBe(false)
  })

  it('bloquea el domingo recien en su propio kickoff, no antes', () => {
    const sunGame = game({ id: 'sun', kickoffAt: sundayKickoff })
    expect(isWeeklyPickLocked(games, sunGame, sundayKickoff)).toBe(true)
  })
})
