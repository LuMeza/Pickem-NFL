import { describe, expect, it } from 'vitest'
import { resolveWeeklyWinner } from './resolveWeeklyWinner'
import type { StandingRow } from '@/core/entities/standings'

function row(userId: string, correctCount: number): StandingRow {
  return { userId, displayName: userId.toUpperCase(), correctCount, currentStreak: 0 }
}

describe('resolveWeeklyWinner', () => {
  it('returns the score when the user is alone in first place', () => {
    const result = resolveWeeklyWinner([row('a', 11), row('b', 9)], 'a')
    expect(result).toEqual({ correctCount: 11, coWinners: [] })
  })

  it('lists the other winners when first place is tied', () => {
    const result = resolveWeeklyWinner([row('a', 11), row('b', 11), row('c', 11), row('d', 8)], 'b')
    expect(result?.correctCount).toBe(11)
    expect(result?.coWinners.map((winner) => winner.userId)).toEqual(['a', 'c'])
  })

  it('returns null when the user is not in first place', () => {
    expect(resolveWeeklyWinner([row('a', 11), row('b', 9)], 'b')).toBeNull()
  })

  it('returns null when the user is not in the standings', () => {
    expect(resolveWeeklyWinner([row('a', 11)], 'zzz')).toBeNull()
  })

  it('returns null when the top score is zero', () => {
    expect(resolveWeeklyWinner([row('a', 0), row('b', 0)], 'a')).toBeNull()
  })

  it('returns null for empty standings', () => {
    expect(resolveWeeklyWinner([], 'a')).toBeNull()
  })
})
