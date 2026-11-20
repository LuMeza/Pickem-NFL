import type { GameOutcome } from '@/core/entities/gameResult'
import type { WeeklyPickValue } from '@/core/ports/WeeklyPickRepository'

export interface PickCell {
  pick: WeeklyPickValue | null
  outcome: GameOutcome | null
}

export interface PickComparisonRow {
  gameId: string
  mine: WeeklyPickValue | null
  theirs: WeeklyPickValue | null
  outcome: GameOutcome | null
  /** Los dos eligieron lo mismo. Si a alguno le falta el pick no cuenta como coincidencia. */
  agree: boolean
  /** null mientras el partido no tiene resultado o si esa persona no hizo pick. */
  mineCorrect: boolean | null
  theirsCorrect: boolean | null
}

export interface PickComparison {
  rows: PickComparisonRow[]
  agreeCount: number
  differCount: number
  mineCorrect: number
  theirsCorrect: number
}

function correctness(cell: PickCell | undefined): boolean | null {
  if (!cell || cell.pick === null || cell.outcome === null) return null
  return cell.pick === cell.outcome
}

/** Compara, partido por partido y en el orden recibido, los picks de dos jugadores. */
export function comparePicks(
  gameIds: string[],
  mine: Map<string, PickCell>,
  theirs: Map<string, PickCell>,
): PickComparison {
  const rows = gameIds.map<PickComparisonRow>((gameId) => {
    const myCell = mine.get(gameId)
    const theirCell = theirs.get(gameId)
    const myPick = myCell?.pick ?? null
    const theirPick = theirCell?.pick ?? null
    return {
      gameId,
      mine: myPick,
      theirs: theirPick,
      outcome: myCell?.outcome ?? theirCell?.outcome ?? null,
      agree: myPick !== null && myPick === theirPick,
      mineCorrect: correctness(myCell),
      theirsCorrect: correctness(theirCell),
    }
  })

  const agreeCount = rows.filter((row) => row.agree).length
  return {
    rows,
    agreeCount,
    differCount: rows.length - agreeCount,
    mineCorrect: rows.filter((row) => row.mineCorrect === true).length,
    theirsCorrect: rows.filter((row) => row.theirsCorrect === true).length,
  }
}

/** Aciertos de un jugador en la semana, sobre los partidos ya jugados. */
export function countCorrectPicks(cells: Map<string, PickCell>): number {
  let correct = 0
  for (const cell of cells.values()) if (correctness(cell) === true) correct += 1
  return correct
}
