export interface SurvivorRankingCandidate {
  userId: string
  /** Orden cronologico de la semana de eliminacion (mayor = cayo mas tarde = mejor posicion). */
  eliminatedWeekOrder: number
  /** Orden cronologico de la primera derrota (mayor = duro mas con su vida original), o null si nunca perdio su vida original. */
  firstLossWeekOrder: number | null
}

export interface SurvivorRankingGroup {
  position: number
  userIds: string[]
}
