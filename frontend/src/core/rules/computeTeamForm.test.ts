import { describe, expect, it } from 'vitest'
import { computeTeamForm } from './computeTeamForm'
import type { Game } from '@/core/entities/catalog'
import type { GameResult } from '@/core/entities/gameResult'

function game(id: string, home: string, away: string, kickoffAt: string, weekId = 'w-reg'): Game {
  return { id, weekId, homeTeamId: home, awayTeamId: away, kickoffAt: new Date(kickoffAt), livePeriod: null, liveClock: null }
}

function result(gameId: string, outcome: GameResult['outcome']): GameResult {
  return { gameId, outcome, homeScore: 20, awayScore: 17, resultSource: 'auto_sync' }
}

const counted = new Set(['w-reg'])

describe('computeTeamForm', () => {
  it('calcula récord y racha en orden cronológico sin importar el orden de entrada', () => {
    const games = [
      game('g3', 'GB', 'KC', '2026-09-15'),
      game('g1', 'GB', 'CAR', '2026-09-01'),
      game('g2', 'DAL', 'GB', '2026-09-08'),
    ]
    const results = new Map([
      ['g1', result('g1', 'home')], // GB gana
      ['g2', result('g2', 'home')], // GB pierde de visita
      ['g3', result('g3', 'home')], // GB gana
    ])
    expect(computeTeamForm('GB', games, results, counted)).toEqual({
      wins: 2,
      losses: 1,
      ties: 0,
      recent: ['W', 'L', 'W'],
    })
  })

  it('limita la racha a los últimos N resultados pero el récord cuenta todos', () => {
    const games = Array.from({ length: 7 }, (_, i) => game(`g${i}`, 'GB', 'CAR', `2026-09-0${i + 1}`))
    const results = new Map(games.map((g, i) => [g.id, result(g.id, i < 2 ? 'away' : 'home')]))
    const form = computeTeamForm('GB', games, results, counted)
    expect(form.wins).toBe(5)
    expect(form.losses).toBe(2)
    expect(form.recent).toEqual(['W', 'W', 'W', 'W', 'W'])
  })

  it('ignora partidos sin resultado y de semanas no contadas', () => {
    const games = [
      game('g1', 'GB', 'CAR', '2026-08-10', 'w-pre'),
      game('g2', 'GB', 'CAR', '2026-09-01'),
      game('g3', 'GB', 'KC', '2026-09-08'),
    ]
    const results = new Map([
      ['g1', result('g1', 'home')],
      ['g2', result('g2', 'home')],
    ])
    expect(computeTeamForm('GB', games, results, counted)).toEqual({ wins: 1, losses: 0, ties: 0, recent: ['W'] })
  })

  it('cuenta empates', () => {
    const games = [game('g1', 'GB', 'CAR', '2026-09-01')]
    const results = new Map([['g1', result('g1', 'tie')]])
    expect(computeTeamForm('GB', games, results, counted)).toEqual({ wins: 0, losses: 0, ties: 1, recent: ['T'] })
  })
})
