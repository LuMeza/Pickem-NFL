import type { Game } from '@/core/entities/catalog'
import type { GameResult } from '@/core/entities/gameResult'

export interface TeamStanding {
  wins: number
  losses: number
  ties: number
}

/** Record W-L-T de un equipo, contando solo los partidos con resultado ya cargado. */
export function computeTeamStanding(teamId: string, games: Game[], results: Map<string, GameResult>): TeamStanding {
  let wins = 0
  let losses = 0
  let ties = 0

  for (const game of games) {
    if (game.homeTeamId !== teamId && game.awayTeamId !== teamId) continue
    const result = results.get(game.id)
    if (!result) continue

    if (result.outcome === 'tie') {
      ties += 1
      continue
    }
    const won = (result.outcome === 'home' && game.homeTeamId === teamId) || (result.outcome === 'away' && game.awayTeamId === teamId)
    if (won) wins += 1
    else losses += 1
  }

  return { wins, losses, ties }
}

/** Proximo partido de un equipo (kickoff mas cercano hacia adelante), o null si no tiene ninguno pendiente. */
export function findNextGame(teamId: string, games: Game[], now: Date): Game | null {
  const upcoming = games
    .filter((game) => game.homeTeamId === teamId || game.awayTeamId === teamId)
    .filter((game) => game.kickoffAt.getTime() >= now.getTime())
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())
  return upcoming[0] ?? null
}
