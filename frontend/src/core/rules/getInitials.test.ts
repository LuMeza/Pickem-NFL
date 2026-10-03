import { describe, expect, it } from 'vitest'
import { getInitials } from './getInitials'

describe('getInitials', () => {
  it('toma primera letra del primer y último nombre', () => {
    expect(getInitials('Jorge López Robles')).toBe('JR')
  })

  it('con un solo nombre usa sus dos primeras letras', () => {
    expect(getInitials('Lu')).toBe('LU')
  })

  it('ignora emojis en vez de partirlos a la mitad', () => {
    expect(getInitials('Lu 🧸')).toBe('LU')
    expect(getInitials('🏈 Toño Berlanga')).toBe('TB')
  })

  it('respeta letras con acento', () => {
    expect(getInitials('Ángel Ñúñez')).toBe('ÁÑ')
  })

  it('regresa ? si no hay letras', () => {
    expect(getInitials('  🧸 ')).toBe('?')
  })
})
