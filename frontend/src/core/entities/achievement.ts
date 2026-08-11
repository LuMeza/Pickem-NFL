export type AchievementScope = 'pickem' | 'survivor' | 'general'

export interface Achievement {
  id: string
  scope: AchievementScope
  title: string
  description: string
}

export interface ProfileAchievement extends Achievement {
  unlocked: boolean
}

export interface ProfilePickemSummary {
  totalCorrect: number
  /** Picks sobre partidos que ya tienen resultado — base para el % de efectividad. */
  totalPicked: number
  /** Todos los picks del usuario, tengan o no resultado ya cargado — distingue "sin picks" de "picks pendientes de resultado". */
  totalPicksMade: number
}

export interface ProfileWeeklyTrendPoint {
  weekSortOrder: number
  weekType: 'pretemporada' | 'regular' | 'playoffs'
  weekNumber: number
  totalCorrect: number
  totalPicked: number
}
