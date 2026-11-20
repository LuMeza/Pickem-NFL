import { describe, expect, it } from 'vitest'
import { weeklyPicksBoardOpensAt } from './weeklyPicksBoardOpensAt'
import type { Game } from '@/core/entities/catalog'

function game(id: string, kickoffAt: string): Game {
  return { id, weekId: 'w1', homeTeamId: 'KC', awayTeamId: 'BUF', kickoffAt: new Date(kickoffAt), livePeriod: null, liveClock: null }
}

describe('weeklyPicksBoardOpensAt', () => {
  it('returns null for a week without games', () => {
    expect(weeklyPicksBoardOpensAt([])).toBeNull()
  })

  it('opens at the latest day-group deadline of the week', () => {
    const games = [game('g1', '2026-11-20T01:15:00Z'), game('g2', '2026-11-22T18:00:00Z'), game('g3', '2026-11-23T01:20:00Z')]
    const opensAt = weeklyPicksBoardOpensAt(games)
    expect(opensAt).not.toBeNull()
    // El último grupo (domingo con lunes) cierra en el primer kickoff del domingo.
    expect(opensAt!.getTime()).toBeGreaterThan(new Date('2026-11-20T01:15:00Z').getTime())
  })
})
