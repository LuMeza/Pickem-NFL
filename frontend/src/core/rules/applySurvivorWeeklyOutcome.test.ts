import { describe, expect, it } from 'vitest'
import { applySurvivorWeeklyOutcome } from './applySurvivorWeeklyOutcome'
import type { SurvivorState } from '@/core/entities/survivor'

const aliveOriginalLife: SurvivorState = {
  currentLife: 1,
  status: 'alive',
  firstLossWeekId: null,
  eliminatedWeekId: null,
}

describe('applySurvivorWeeklyOutcome', () => {
  it('mantiene al usuario vivo con la misma vida cuando gana', () => {
    const result = applySurvivorWeeklyOutcome(aliveOriginalLife, 'week-3', 'win')
    expect(result).toEqual(aliveOriginalLife)
  })

  it('consume una vida extra y registra la primera derrota al perder con la vida original', () => {
    const result = applySurvivorWeeklyOutcome(aliveOriginalLife, 'week-3', 'loss_or_no_pick')
    expect(result).toEqual({
      currentLife: 2,
      status: 'alive',
      firstLossWeekId: 'week-3',
      eliminatedWeekId: null,
    })
  })

  it('no vuelve a sobreescribir firstLossWeekId en derrotas posteriores', () => {
    const afterFirstLoss: SurvivorState = {
      currentLife: 2,
      status: 'alive',
      firstLossWeekId: 'week-3',
      eliminatedWeekId: null,
    }
    const result = applySurvivorWeeklyOutcome(afterFirstLoss, 'week-6', 'loss_or_no_pick')
    expect(result.firstLossWeekId).toBe('week-3')
    expect(result.currentLife).toBe(3)
  })

  it('elimina al usuario cuando pierde sin vidas extra disponibles', () => {
    const lastLife: SurvivorState = {
      currentLife: 3,
      status: 'alive',
      firstLossWeekId: 'week-3',
      eliminatedWeekId: null,
    }
    const result = applySurvivorWeeklyOutcome(lastLife, 'week-9', 'loss_or_no_pick')
    expect(result).toEqual({
      currentLife: 3,
      status: 'eliminated',
      firstLossWeekId: 'week-3',
      eliminatedWeekId: 'week-9',
    })
  })

  it('trata la ausencia de elección igual que una derrota', () => {
    const result = applySurvivorWeeklyOutcome(aliveOriginalLife, 'week-3', 'loss_or_no_pick')
    expect(result.currentLife).toBe(2)
  })

  it('un usuario ya eliminado no cambia de estado', () => {
    const eliminated: SurvivorState = {
      currentLife: 3,
      status: 'eliminated',
      firstLossWeekId: 'week-3',
      eliminatedWeekId: 'week-9',
    }
    const result = applySurvivorWeeklyOutcome(eliminated, 'week-10', 'win')
    expect(result).toEqual(eliminated)
  })
})
