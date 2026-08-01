import type { SurvivorRepository } from '@/core/ports/SurvivorRepository'

export interface RecalculateSurvivorStateDeps {
  survivorRepository: SurvivorRepository
}

export interface RecalculateSurvivorStateParams {
  groupId: string
}

/** Panel admin, plan B: recalcular Survivor a mano — ver design.md decision 4. */
export function recalculateSurvivorState(
  deps: RecalculateSurvivorStateDeps,
  params: RecalculateSurvivorStateParams,
): Promise<void> {
  return deps.survivorRepository.recalculate(params.groupId)
}
