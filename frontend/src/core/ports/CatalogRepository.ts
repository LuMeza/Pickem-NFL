import type { Game, Team, Week } from '@/core/entities/catalog'

/** Ver openspec/changes/base-plataforma specs/catalogo-nfl. Lectura publica para cualquier autenticado. */
export interface CatalogRepository {
  listTeams(): Promise<Team[]>
  listWeeks(): Promise<Week[]>
  listGamesForWeek(weekId: string): Promise<Game[]>
}
