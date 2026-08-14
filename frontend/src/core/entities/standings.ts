export interface StandingRow {
  userId: string
  displayName: string
  correctCount: number
  /** Aciertos consecutivos hasta el pick con resultado mas reciente — 0 si el ultimo fue un fallo. */
  currentStreak: number
}
