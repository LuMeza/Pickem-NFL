import { describe, expect, it } from 'vitest'
import { formatLivePeriod } from './formatLivePeriod'

describe('formatLivePeriod', () => {
  it('devuelve null cuando no hay periodo (no esta en vivo)', () => {
    expect(formatLivePeriod(null, null)).toBeNull()
  })

  it('traduce cada cuarto regular al español', () => {
    expect(formatLivePeriod(1, null)).toBe('1er cuarto')
    expect(formatLivePeriod(2, null)).toBe('2do cuarto')
    expect(formatLivePeriod(3, null)).toBe('3er cuarto')
    expect(formatLivePeriod(4, null)).toBe('4to cuarto')
  })

  it('agrega el reloj cuando esta disponible', () => {
    expect(formatLivePeriod(3, '5:13')).toBe('3er cuarto · 5:13')
  })

  it('marca tiempo extra a partir del periodo 5', () => {
    expect(formatLivePeriod(5, null)).toBe('Tiempo extra')
    expect(formatLivePeriod(6, null)).toBe('Tiempo extra 2')
  })
})
