import { describe, expect, it } from 'vitest'
import { formatLivePeriod } from './formatLivePeriod'

describe('formatLivePeriod', () => {
  it('devuelve null cuando no hay periodo (no esta en vivo)', () => {
    expect(formatLivePeriod(null)).toBeNull()
  })

  it('traduce cada cuarto regular al español', () => {
    expect(formatLivePeriod(1)).toBe('1er cuarto')
    expect(formatLivePeriod(2)).toBe('2do cuarto')
    expect(formatLivePeriod(3)).toBe('3er cuarto')
    expect(formatLivePeriod(4)).toBe('4to cuarto')
  })

  it('marca tiempo extra a partir del periodo 5', () => {
    expect(formatLivePeriod(5)).toBe('Tiempo extra')
    expect(formatLivePeriod(6)).toBe('Tiempo extra 2')
  })
})
