import type { PlayoffsRepository, SavePlayoffPickParams } from '@/core/ports/PlayoffsRepository'

export interface SavePlayoffPickDeps {
  playoffsRepository: PlayoffsRepository
}

/** Registrar/editar una predicción de playoffs antes del kickoff — ver specs/prediccion-playoffs. */
export function savePlayoffPick(deps: SavePlayoffPickDeps, params: SavePlayoffPickParams): Promise<void> {
  return deps.playoffsRepository.savePick(params)
}
