import type { CatalogRepository } from '@/core/ports/CatalogRepository'
import type { Game } from '@/core/entities/catalog'

export interface ListGamesForTeamDeps {
  catalogRepository: CatalogRepository
}

export interface ListGamesForTeamParams {
  teamId: string
}

/** Calendario de un equipo (todas las semanas) — pantalla de detalle de equipo. */
export function listGamesForTeam(deps: ListGamesForTeamDeps, params: ListGamesForTeamParams): Promise<Game[]> {
  return deps.catalogRepository.listGamesForTeam(params.teamId)
}
