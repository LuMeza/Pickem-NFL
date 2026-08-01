import type { CatalogRepository } from '@/core/ports/CatalogRepository'
import type { Game } from '@/core/entities/catalog'

export interface ListGamesForWeekDeps {
  catalogRepository: CatalogRepository
}

export interface ListGamesForWeekParams {
  weekId: string
}

/** Partidos de una semana — ver openspec/changes/base-plataforma specs/catalogo-nfl. */
export function listGamesForWeek(deps: ListGamesForWeekDeps, params: ListGamesForWeekParams): Promise<Game[]> {
  return deps.catalogRepository.listGamesForWeek(params.weekId)
}
