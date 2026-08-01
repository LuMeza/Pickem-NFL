import type { SaveSurvivorPickParams, SurvivorRepository } from '@/core/ports/SurvivorRepository'

export interface SaveSurvivorPickDeps {
  survivorRepository: SurvivorRepository
}

/** Elegir/editar el equipo de la semana en Survivor — ver specs/prediccion-survivor. */
export function saveSurvivorPick(deps: SaveSurvivorPickDeps, params: SaveSurvivorPickParams): Promise<void> {
  return deps.survivorRepository.savePick(params)
}
