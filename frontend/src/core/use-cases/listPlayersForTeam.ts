import type { CatalogRepository } from '@/core/ports/CatalogRepository'
import type { Player } from '@/core/entities/catalog'

export interface ListPlayersForTeamDeps {
  catalogRepository: CatalogRepository
}

export interface ListPlayersForTeamParams {
  teamId: string
}

/** Plantilla de un equipo — pantalla de detalle de equipo. */
export function listPlayersForTeam(deps: ListPlayersForTeamDeps, params: ListPlayersForTeamParams): Promise<Player[]> {
  return deps.catalogRepository.listPlayersForTeam(params.teamId)
}
