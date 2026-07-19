import { describe, expect, it } from 'vitest'
import { isPredictionLocked } from './isPredictionLocked'

describe('isPredictionLocked', () => {
  const kickoffAt = new Date('2026-09-10T20:00:00Z')

  it('no bloquea la prediccion antes del kickoff', () => {
    const now = new Date('2026-09-10T19:59:59Z')
    expect(isPredictionLocked({ kickoffAt }, now)).toBe(false)
  })

  it('bloquea la prediccion exactamente en el kickoff', () => {
    expect(isPredictionLocked({ kickoffAt }, kickoffAt)).toBe(true)
  })

  it('bloquea la prediccion despues del kickoff', () => {
    const now = new Date('2026-09-10T20:00:01Z')
    expect(isPredictionLocked({ kickoffAt }, now)).toBe(true)
  })
})
