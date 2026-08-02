import { describe, expect, it } from 'vitest'
import { resolveSurvivorRanking } from './resolveSurvivorRanking'

describe('resolveSurvivorRanking', () => {
  it('ordena sin empates por semana de eliminación, el último en caer va primero', () => {
    const result = resolveSurvivorRanking([
      { userId: 'a', eliminatedWeekOrder: 5, firstLossWeekOrder: 2 },
      { userId: 'b', eliminatedWeekOrder: 8, firstLossWeekOrder: 4 },
      { userId: 'c', eliminatedWeekOrder: 3, firstLossWeekOrder: 1 },
    ])

    expect(result).toEqual([
      { position: 1, userIds: ['b'] },
      { position: 2, userIds: ['a'] },
      { position: 3, userIds: ['c'] },
    ])
  })

  it('desempata por duración con la vida original cuando la semana de eliminación coincide', () => {
    const result = resolveSurvivorRanking([
      { userId: 'a', eliminatedWeekOrder: 6, firstLossWeekOrder: 2 },
      { userId: 'b', eliminatedWeekOrder: 6, firstLossWeekOrder: 4 },
    ])

    // b duró más semanas con su vida original (firstLossWeekOrder mayor) -> mejor posición
    expect(result).toEqual([
      { position: 1, userIds: ['b'] },
      { position: 2, userIds: ['a'] },
    ])
  })

  it('reporta empate cuando coincide semana de eliminación y duración de vida original', () => {
    const result = resolveSurvivorRanking([
      { userId: 'a', eliminatedWeekOrder: 6, firstLossWeekOrder: 2 },
      { userId: 'b', eliminatedWeekOrder: 6, firstLossWeekOrder: 2 },
    ])

    expect(result).toEqual([{ position: 1, userIds: ['a', 'b'] }])
  })

  it('reporta empate cuando ninguno perdió nunca su vida original', () => {
    const result = resolveSurvivorRanking([
      { userId: 'a', eliminatedWeekOrder: 6, firstLossWeekOrder: null },
      { userId: 'b', eliminatedWeekOrder: 6, firstLossWeekOrder: null },
    ])

    expect(result).toEqual([{ position: 1, userIds: ['a', 'b'] }])
  })
})
