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
  totalPicked: number
}

export interface ProfileWeeklyTrendPoint {
  weekSortOrder: number
  weekType: 'pretemporada' | 'regular' | 'playoffs'
  weekNumber: number
  totalCorrect: number
  totalPicked: number
}
