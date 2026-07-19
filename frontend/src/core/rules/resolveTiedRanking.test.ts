import { describe, expect, it } from 'vitest'
import { resolveTiedRanking } from './resolveTiedRanking'

describe('resolveTiedRanking', () => {
  it('asigna posiciones distintas cuando no hay empates', () => {
    const result = resolveTiedRanking([
      { userId: 'a', total: 12 },
      { userId: 'b', total: 9 },
      { userId: 'c', total: 5 },
    ])

    expect(result).toEqual([
      { position: 1, total: 12, userIds: ['a'] },
      { position: 2, total: 9, userIds: ['b'] },
      { position: 3, total: 5, userIds: ['c'] },
    ])
  })

  it('reporta empate en el primer lugar sin desempatar, y salta la siguiente posicion', () => {
    const result = resolveTiedRanking([
      { userId: 'a', total: 10 },
      { userId: 'b', total: 10 },
      { userId: 'c', total: 8 },
    ])

    expect(result).toEqual([
      { position: 1, total: 10, userIds: ['a', 'b'] },
      { position: 3, total: 8, userIds: ['c'] },
    ])
  })

  it('reporta empate en 2do/3er lugar sin desempatar', () => {
    const result = resolveTiedRanking([
      { userId: 'a', total: 10 },
      { userId: 'b', total: 8 },
      { userId: 'c', total: 8 },
    ])

    expect(result).toEqual([
      { position: 1, total: 10, userIds: ['a'] },
      { position: 2, total: 8, userIds: ['b', 'c'] },
    ])
  })
})
