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
  /** Cuarto en curso (1-4, 5+ tiempo extra) y reloj mostrado por ESPN — solo mientras el partido esta en vivo. */
  livePeriod: number | null
  liveClock: string | null
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
  /** Designación semanal de lesión (Questionable/Doubtful/Out), sincronizada del injury report de ESPN — distinta de `status`, que es el estado de roster de largo plazo. */
  injuryStatus: string | null
  injuryDetail: string | null
}
