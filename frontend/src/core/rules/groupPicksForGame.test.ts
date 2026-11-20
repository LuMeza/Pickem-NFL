import { describe, expect, it } from 'vitest'
import { groupPicksForGame, type GamePickEntry } from './groupPicksForGame'

function entry(userId: string, pick: GamePickEntry['pick'], outcome: GamePickEntry['outcome'] = null): GamePickEntry {
  return { userId, displayName: userId.toUpperCase(), pick, outcome }
}

describe('groupPicksForGame', () => {
  it('splits players by the side they picked', () => {
    const groups = groupPicksForGame([entry('a', 'home'), entry('b', 'away'), entry('c', 'home'), entry('d', 'tie')])
    expect(groups.home.map((e) => e.userId)).toEqual(['a', 'c'])
    expect(groups.away.map((e) => e.userId)).toEqual(['b'])
    expect(groups.tie.map((e) => e.userId)).toEqual(['d'])
    expect(groups.none).toEqual([])
  })

  it('puts players without a pick in the none group', () => {
    const groups = groupPicksForGame([entry('a', null), entry('b', 'home')])
    expect(groups.none.map((e) => e.userId)).toEqual(['a'])
  })

  it('exposes the game outcome once it is known', () => {
    expect(groupPicksForGame([entry('a', 'home', 'home')]).outcome).toBe('home')
    expect(groupPicksForGame([entry('a', 'home')]).outcome).toBeNull()
  })

  it('handles an empty list', () => {
    const groups = groupPicksForGame([])
    expect(groups).toEqual({ home: [], away: [], tie: [], none: [], outcome: null })
  })
})
