export interface Team {
  id: string
  name: string
}

export type WeekType = 'hof' | 'pretemporada' | 'regular' | 'playoffs'

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

export interface Player {
  id: string
  teamId: string
  fullName: string
  position: string | null
  jerseyNumber: string | null
  unit: string | null
  /** Ficha del jugador — viene del mismo roster de ESPN que ya se sincroniza (ver sync-espn-roster), sin llamadas extra. */
  heightIn: number | null
  weightLbs: number | null
  birthDate: string | null
  age: number | null
  college: string | null
  experienceYears: number | null
  status: string | null
}
