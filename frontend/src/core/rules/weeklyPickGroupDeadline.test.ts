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
    ...overrides,
  }
}

// Jueves 2026-09-10, 20:00 ET (entre semana).
const thursdayKickoff = new Date('2026-09-11T00:00:00Z')
// Domingo 2026-09-13, 13:00 ET (fin de semana).
const sundayKickoff = new Date('2026-09-13T17:00:00Z')
// Lunes 2026-09-14, 20:15 ET — cruza medianoche UTC (ya es martes en UTC) pero sigue siendo lunes en ET.
const mondayNightKickoff = new Date('2026-09-15T00:15:00Z')

describe('weeklyPickGroupDeadline', () => {
  it('agrupa el bloque "entre semana" por separado del bloque "fin de semana"', () => {
    const games = [
      game({ id: 'thu', kickoffAt: thursdayKickoff }),
      game({ id: 'sun', kickoffAt: sundayKickoff }),
      game({ id: 'mon', kickoffAt: mondayNightKickoff }),
    ]
    expect(weeklyPickGroupDeadline(games, thursdayKickoff)).toEqual(thursdayKickoff)
    expect(weeklyPickGroupDeadline(games, sundayKickoff)).toEqual(sundayKickoff)
    expect(weeklyPickGroupDeadline(games, mondayNightKickoff)).toEqual(sundayKickoff)
  })

  it('clasifica un Monday Night que cruza medianoche UTC como fin de semana, no como martes', () => {
    const games = [game({ id: 'mon', kickoffAt: mondayNightKickoff })]
    expect(weeklyPickGroupDeadline(games, mondayNightKickoff)).toEqual(mondayNightKickoff)
  })

  it('devuelve null si no hay partidos en el bloque correspondiente', () => {
    const games = [game({ id: 'thu', kickoffAt: thursdayKickoff })]
    expect(weeklyPickGroupDeadline(games, sundayKickoff)).toBeNull()
  })
})

describe('isWeeklyPickLocked', () => {
  const games = [game({ id: 'thu', kickoffAt: thursdayKickoff }), game({ id: 'sun', kickoffAt: sundayKickoff })]

  it('no bloquea el bloque "entre semana" antes de su propio kickoff mas temprano', () => {
    const thuGame = game({ id: 'thu', kickoffAt: thursdayKickoff })
    expect(isWeeklyPickLocked(games, thuGame, new Date('2026-09-10T23:59:59Z'))).toBe(false)
  })

  it('bloquea el bloque "entre semana" en su propio kickoff, sin afectar al de fin de semana', () => {
    const thuGame = game({ id: 'thu', kickoffAt: thursdayKickoff })
    const sunGame = game({ id: 'sun', kickoffAt: sundayKickoff })
    const justAfterThursday = new Date('2026-09-11T00:00:01Z')
    expect(isWeeklyPickLocked(games, thuGame, justAfterThursday)).toBe(true)
    expect(isWeeklyPickLocked(games, sunGame, justAfterThursday)).toBe(false)
  })

  it('bloquea el bloque de fin de semana recien en el kickoff del sabado/domingo, no antes', () => {
    const sunGame = game({ id: 'sun', kickoffAt: sundayKickoff })
    expect(isWeeklyPickLocked(games, sunGame, sundayKickoff)).toBe(true)
  })
})
