import type { CatalogRepository, GameChanges } from '@/core/ports/CatalogRepository'
import type { Game } from '@/core/entities/catalog'

export interface UpdateGameDeps {
  catalogRepository: CatalogRepository
}

export interface UpdateGameParams {
  gameId: string
  changes: GameChanges
}

/** Panel admin: corregir equipos u horario de un partido ya cargado. */
export function updateGame(deps: UpdateGameDeps, params: UpdateGameParams): Promise<Game> {
  return deps.catalogRepository.updateGame(params.gameId, params.changes)
}
