export interface Team {
  id: string
  name: string
}

export type WeekType = 'pretemporada' | 'regular' | 'playoffs'

export interface Week {
  id: string
  type: WeekType
  number: number
}

export interface Game {
  id: string
  weekId: string
  homeTeamId: string
  awayTeamId: string
  kickoffAt: Date
}
