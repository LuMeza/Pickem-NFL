export interface RankingEntry {
  userId: string
  total: number
}

export interface RankingGroup {
  /** Posicion de ranking estandar: 1,2,2,4 (se salta al tamano del grupo empatado, nunca se reordena). */
  position: number
  total: number
  userIds: string[]
}
