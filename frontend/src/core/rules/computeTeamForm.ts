import type { Game } from '@/core/entities/catalog'
import type { GameResult } from '@/core/entities/gameResult'

export type FormMark = 'W' | 'L' | 'T'

export interface TeamForm {
  wins: number
  losses: number
  ties: number
  /** Últimos resultados, del más antiguo al más reciente (máximo `limit`). */
  recent: FormMark[]
}

export const RECENT_FORM_LIMIT = 5

/**
 * Récord de temporada y racha reciente de un equipo, contando solo partidos
 * con resultado cargado. `countedWeekIds` deja fuera pretemporada y Salón de
 * la Fama: el récord de una tarjeta es el de temporada regular y playoffs.
 */
export function computeTeamForm(
  teamId: string,
  games: Game[],
  results: Map<string, GameResult>,
  countedWeekIds: Set<string>,
  limit: number = RECENT_FORM_LIMIT,
): TeamForm {
  const played = games
    .filter((game) => game.homeTeamId === teamId || game.awayTeamId === teamId)
    .filter((game) => countedWeekIds.has(game.weekId) && results.has(game.id))
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())

  const marks: FormMark[] = played.map((game) => {
    const { outcome } = results.get(game.id)!
    if (outcome === 'tie') return 'T'
    const won = (outcome === 'home') === (game.homeTeamId === teamId)
    return won ? 'W' : 'L'
  })

  return {
    wins: marks.filter((mark) => mark === 'W').length,
    losses: marks.filter((mark) => mark === 'L').length,
    ties: marks.filter((mark) => mark === 'T').length,
    recent: marks.slice(-limit),
  }
}
