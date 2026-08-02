export interface SurvivorRankingCandidate {
  userId: string
  /** Orden cronológico de la semana de eliminación (mayor = cayó más tarde = mejor posición). */
  eliminatedWeekOrder: number
  /** Orden cronológico de la primera derrota (mayor = duró más con su vida original), o null si nunca perdió su vida original. */
  firstLossWeekOrder: number | null
}

export interface SurvivorRankingGroup {
  position: number
  userIds: string[]
}
