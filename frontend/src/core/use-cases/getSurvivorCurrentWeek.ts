import type { SurvivorRepository } from '@/core/ports/SurvivorRepository'

export interface GetSurvivorCurrentWeekDeps {
  survivorRepository: SurvivorRepository
}

/** Número de la semana regular actualmente abierta — ver design.md decision 8. */
export function getSurvivorCurrentWeek(deps: GetSurvivorCurrentWeekDeps): Promise<number | null> {
  return deps.survivorRepository.getCurrentWeekNumber()
}
