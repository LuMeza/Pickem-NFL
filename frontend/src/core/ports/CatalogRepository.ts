import type { Game, Player, Team, Week } from '@/core/entities/catalog'

export interface NewGame {
  weekId: string
  homeTeamId: string
  awayTeamId: string
  kickoffAt: Date
}

export interface GameChanges {
  homeTeamId: string
  awayTeamId: string
  kickoffAt: Date
}

/**
 * Ver openspec/changes/base-plataforma specs/catalogo-nfl. Lectura pública
 * para cualquier autenticado; `createGame` exclusivo de platform_admins
 * (impuesto por RLS).
 */
export interface CatalogRepository {
  listTeams(): Promise<Team[]>
  listWeeks(): Promise<Week[]>
  listGamesForWeek(weekId: string): Promise<Game[]>
  /** Todos los partidos de la temporada (hof/pretemporada/regular/playoffs), para la vista de calendario general. */
  listAllGames(): Promise<Game[]>
  listGamesForTeam(teamId: string): Promise<Game[]>
  listPlayersForTeam(teamId: string): Promise<Player[]>
  createGame(game: NewGame): Promise<Game>
  updateGame(gameId: string, changes: GameChanges): Promise<Game>
}
