import type { CatalogRepository, NewGame } from '@/core/ports/CatalogRepository'
import type { Game } from '@/core/entities/catalog'

export interface CreateGameDeps {
  catalogRepository: CatalogRepository
}

/** Panel admin: agregar un partido al calendario de una semana — ver specs/catalogo-nfl. */
export function createGame(deps: CreateGameDeps, game: NewGame): Promise<Game> {
  return deps.catalogRepository.createGame(game)
}
