import { describe, expect, it } from 'vitest'
import { formatPredictionSpread } from './formatPredictionSpread'

describe('formatPredictionSpread', () => {
  it('spread negativo: el local es favorito', () => {
    expect(formatPredictionSpread(-7.5)).toEqual({ favorite: 'home', points: 7.5 })
  })

  it('spread positivo: el visitante es favorito', () => {
    expect(formatPredictionSpread(3)).toEqual({ favorite: 'away', points: 3 })
  })

  it('sin línea o línea pareja no hay favorito', () => {
    expect(formatPredictionSpread(null)).toBeNull()
    expect(formatPredictionSpread(0)).toBeNull()
  })
})
