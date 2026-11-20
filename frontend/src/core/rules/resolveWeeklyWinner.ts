import type { StandingRow } from '@/core/entities/standings'

export interface WeeklyWinner {
  correctCount: number
  /** Los demás jugadores empatados en el primer lugar (sin contar al usuario). */
  coWinners: StandingRow[]
}

/**
 * Si el usuario terminó en el primer lugar de la semana (solo o empatado),
 * devuelve su puntaje y con quién comparte el lugar; si no, null.
 * Con cero aciertos no hay nada que celebrar.
 */
export function resolveWeeklyWinner(rows: StandingRow[], userId: string): WeeklyWinner | null {
  if (rows.length === 0) return null
  const topScore = Math.max(...rows.map((row) => row.correctCount))
  if (topScore <= 0) return null

  const winners = rows.filter((row) => row.correctCount === topScore)
  if (!winners.some((row) => row.userId === userId)) return null

  return { correctCount: topScore, coWinners: winners.filter((row) => row.userId !== userId) }
}
