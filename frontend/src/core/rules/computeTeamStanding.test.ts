import { describe, expect, it } from 'vitest'
import { computeTeamStanding, findNextGame } from './computeTeamStanding'
import type { Game } from '@/core/entities/catalog'
import type { GameResult } from '@/core/entities/gameResult'

function game(id: string, home: string, away: string, kickoffAt: string): Game {
  return {
    id,
    weekId: 'week-1',
    homeTeamId: home,
    awayTeamId: away,
    kickoffAt: new Date(kickoffAt),
    livePeriod: null,
    liveClock: null,
  }
}

function result(gameId: string, outcome: GameResult['outcome']): GameResult {
  return { gameId, outcome, homeScore: 20, awayScore: 17, resultSource: 'auto_sync' }
}

describe('computeTeamStanding', () => {
  it('cuenta victorias y derrotas de local y de visita', () => {
    const games = [
      game('g1', 'ARI', 'CAR', '2026-09-01'),
      game('g2', 'DAL', 'ARI', '2026-09-08'),
      game('g3', 'ARI', 'KC', '2026-09-15'),
    ]
    const results = new Map([
      ['g1', result('g1', 'home')], // ARI gana de local
      ['g2', result('g2', 'away')], // ARI gana de visita
      ['g3', result('g3', 'away')], // ARI pierde de local
    ])
    expect(computeTeamStanding('ARI', games, results)).toEqual({ wins: 2, losses: 1, ties: 0 })
  })

  it('cuenta empates', () => {
    const games = [game('g1', 'ARI', 'CAR', '2026-09-01')]
    const results = new Map([['g1', result('g1', 'tie')]])
    expect(computeTeamStanding('ARI', games, results)).toEqual({ wins: 0, losses: 0, ties: 1 })
  })

  it('ignora partidos sin resultado cargado', () => {
    const games = [game('g1', 'ARI', 'CAR', '2026-09-01')]
    expect(computeTeamStanding('ARI', games, new Map())).toEqual({ wins: 0, losses: 0, ties: 0 })
  })

  it('ignora partidos de otros equipos', () => {
    const games = [game('g1', 'DAL', 'KC', '2026-09-01')]
    const results = new Map([['g1', result('g1', 'home')]])
    expect(computeTeamStanding('ARI', games, results)).toEqual({ wins: 0, losses: 0, ties: 0 })
  })
})

describe('findNextGame', () => {
  it('devuelve el partido pendiente con el kickoff mas cercano', () => {
    const now = new Date('2026-09-05')
    const games = [
      game('g1', 'ARI', 'CAR', '2026-09-01'), // ya paso
      game('g2', 'DAL', 'ARI', '2026-09-20'),
      game('g3', 'ARI', 'KC', '2026-09-12'), // el mas cercano hacia adelante
    ]
    expect(findNextGame('ARI', games, now)?.id).toBe('g3')
  })

  it('devuelve null si no hay partidos pendientes', () => {
    const now = new Date('2026-09-05')
    const games = [game('g1', 'ARI', 'CAR', '2026-09-01')]
    expect(findNextGame('ARI', games, now)).toBeNull()
  })

  it('ignora partidos de otros equipos', () => {
    const now = new Date('2026-09-05')
    const games = [game('g1', 'DAL', 'KC', '2026-09-12')]
    expect(findNextGame('ARI', games, now)).toBeNull()
  })
})
