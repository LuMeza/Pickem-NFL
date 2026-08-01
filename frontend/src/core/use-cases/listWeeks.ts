import type { CatalogRepository } from '@/core/ports/CatalogRepository'
import type { Week } from '@/core/entities/catalog'

export interface ListWeeksDeps {
  catalogRepository: CatalogRepository
}

/** Catalogo de semanas de temporada — ver openspec/changes/base-plataforma specs/catalogo-nfl. */
export function listWeeks(deps: ListWeeksDeps): Promise<Week[]> {
  return deps.catalogRepository.listWeeks()
}
