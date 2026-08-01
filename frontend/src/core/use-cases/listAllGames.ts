import type { CatalogRepository } from '@/core/ports/CatalogRepository'
import type { Game } from '@/core/entities/catalog'

export interface ListAllGamesDeps {
  catalogRepository: CatalogRepository
}

/** Todos los partidos de la temporada, para la vista de calendario general — ver specs/catalogo-nfl. */
export function listAllGames(deps: ListAllGamesDeps): Promise<Game[]> {
  return deps.catalogRepository.listAllGames()
}
