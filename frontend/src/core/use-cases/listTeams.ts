import type { CatalogRepository } from '@/core/ports/CatalogRepository'
import type { Team } from '@/core/entities/catalog'

export interface ListTeamsDeps {
  catalogRepository: CatalogRepository
}

/** Catalogo de equipos NFL — ver openspec/changes/base-plataforma specs/catalogo-nfl. */
export function listTeams(deps: ListTeamsDeps): Promise<Team[]> {
  return deps.catalogRepository.listTeams()
}
