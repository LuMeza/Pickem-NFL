import { describe, expect, it } from 'vitest'
import { classifyPointDifference } from './classifyPointDifference'

describe('classifyPointDifference', () => {
  it('clasifica como local_amplio cuando el local gana por más de 6 puntos', () => {
    expect(classifyPointDifference(24, 10)).toBe('local_amplio')
  })

  it('clasifica como visita_amplio cuando la visita gana por más de 6 puntos', () => {
    expect(classifyPointDifference(10, 24)).toBe('visita_amplio')
  })

  it('clasifica como cerrado cuando el margen es exactamente 6 puntos', () => {
    expect(classifyPointDifference(20, 14)).toBe('cerrado')
    expect(classifyPointDifference(14, 20)).toBe('cerrado')
  })

  it('clasifica como cerrado cuando el margen es menor a 6 puntos', () => {
    expect(classifyPointDifference(17, 14)).toBe('cerrado')
  })

  it('clasifica como cerrado en caso de empate', () => {
    expect(classifyPointDifference(17, 17)).toBe('cerrado')
  })
})
