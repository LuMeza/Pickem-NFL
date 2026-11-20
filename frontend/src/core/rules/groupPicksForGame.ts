import type { GameOutcome } from '@/core/entities/gameResult'
import type { WeeklyPickValue } from '@/core/ports/WeeklyPickRepository'

export interface GamePickEntry {
  userId: string
  displayName: string
  pick: WeeklyPickValue | null
  outcome: GameOutcome | null
}

export interface GamePickGroups {
  home: GamePickEntry[]
  away: GamePickEntry[]
  tie: GamePickEntry[]
  /** Jugadores que no hicieron pick en este partido. */
  none: GamePickEntry[]
  /** Resultado del partido, null mientras no se juega. */
  outcome: GameOutcome | null
}

/** Reparte los picks de un partido entre quienes eligieron local, visita, empate o nada. */
export function groupPicksForGame(entries: GamePickEntry[]): GamePickGroups {
  const groups: GamePickGroups = { home: [], away: [], tie: [], none: [], outcome: null }
  for (const entry of entries) {
    if (entry.outcome !== null) groups.outcome = entry.outcome
    if (entry.pick === 'home') groups.home.push(entry)
    else if (entry.pick === 'away') groups.away.push(entry)
    else if (entry.pick === 'tie') groups.tie.push(entry)
    else groups.none.push(entry)
  }
  return groups
}
