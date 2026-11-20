import { describe, expect, it } from 'vitest'
import { comparePicks, countCorrectPicks, type PickCell } from './comparePicks'

function cells(entries: Record<string, PickCell>): Map<string, PickCell> {
  return new Map(Object.entries(entries))
}

describe('comparePicks', () => {
  const mine = cells({
    g1: { pick: 'home', outcome: 'home' },
    g2: { pick: 'away', outcome: 'home' },
    g3: { pick: 'home', outcome: null },
    g4: { pick: null, outcome: 'away' },
  })
  const theirs = cells({
    g1: { pick: 'home', outcome: 'home' },
    g2: { pick: 'home', outcome: 'home' },
    g3: { pick: 'away', outcome: null },
    g4: { pick: 'away', outcome: 'away' },
  })

  it('marks agreement only when both picked the same side', () => {
    const result = comparePicks(['g1', 'g2', 'g3', 'g4'], mine, theirs)
    expect(result.rows.map((row) => row.agree)).toEqual([true, false, false, false])
    expect(result.agreeCount).toBe(1)
    expect(result.differCount).toBe(3)
  })

  it('counts correct picks for each side', () => {
    const result = comparePicks(['g1', 'g2', 'g3', 'g4'], mine, theirs)
    expect(result.mineCorrect).toBe(1)
    expect(result.theirsCorrect).toBe(3)
  })

  it('leaves correctness null while the game has no result or the pick is missing', () => {
    const result = comparePicks(['g3', 'g4'], mine, theirs)
    expect(result.rows[0]).toMatchObject({ mineCorrect: null, theirsCorrect: null })
    expect(result.rows[1]).toMatchObject({ mineCorrect: null, theirsCorrect: true })
  })

  it('keeps the order of the game ids and tolerates missing cells', () => {
    const result = comparePicks(['g2', 'g9'], mine, theirs)
    expect(result.rows.map((row) => row.gameId)).toEqual(['g2', 'g9'])
    expect(result.rows[1]).toMatchObject({ mine: null, theirs: null, agree: false, outcome: null })
  })
})

describe('countCorrectPicks', () => {
  it('counts only picks that match a known outcome', () => {
    expect(
      countCorrectPicks(
        cells({
          a: { pick: 'home', outcome: 'home' },
          b: { pick: 'away', outcome: 'home' },
          c: { pick: 'home', outcome: null },
        }),
      ),
    ).toBe(1)
  })
})
