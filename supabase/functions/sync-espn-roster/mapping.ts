// Funciones puras de parseo del roster público de ESPN — sin llamadas de
// red, para poder probarse aisladas (mismo patron que sync-espn-results).

export interface EspnRosterAthleteItem {
  id?: string
  fullName?: string
  jersey?: string
  position?: { abbreviation?: string }
  height?: number
  weight?: number
  dateOfBirth?: string
  age?: number
  college?: { name?: string }
  experience?: { years?: number }
  status?: { name?: string }
}

export interface EspnRosterGroup {
  position?: string // etiqueta del grupo: 'offense' | 'defense' | 'specialTeam'
  items?: EspnRosterAthleteItem[]
}

export interface EspnRosterResponse {
  athletes?: EspnRosterGroup[]
}

export interface ParsedPlayer {
  espnAthleteId: string
  fullName: string
  jerseyNumber: string | null
  position: string | null
  unit: string | null
  heightIn: number | null
  weightLbs: number | null
  birthDate: string | null
  age: number | null
  college: string | null
  experienceYears: number | null
  status: string | null
  injuryStatus: string | null
  injuryDetail: string | null
}

/** Aplana los grupos offense/defense/specialTeam del roster en una sola lista, descartando entradas sin id o nombre (defensivo ante respuestas parciales de ESPN). */
export function parseEspnRoster(response: EspnRosterResponse): ParsedPlayer[] {
  const players: ParsedPlayer[] = []

  for (const group of response.athletes ?? []) {
    for (const item of group.items ?? []) {
      if (!item.id || !item.fullName) continue

      players.push({
        espnAthleteId: item.id,
        fullName: item.fullName,
        jerseyNumber: item.jersey ?? null,
        position: item.position?.abbreviation ?? null,
        unit: group.position ?? null,
        heightIn: item.height ?? null,
        weightLbs: item.weight ?? null,
        // ESPN manda "2003-02-11T08:00Z" — solo se necesita la fecha para la
        // columna `date`, sin la hora/offset.
        birthDate: item.dateOfBirth ? item.dateOfBirth.slice(0, 10) : null,
        age: item.age ?? null,
        college: item.college?.name ?? null,
        experienceYears: item.experience?.years ?? null,
        status: item.status?.name ?? null,
        injuryStatus: null,
        injuryDetail: null,
      })
    }
  }

  return players
}

export interface EspnInjuryAthleteRef {
  id?: string
}

export interface EspnInjuryDetail {
  type?: string
  detail?: string
}

export interface EspnInjuryEntry {
  athlete?: EspnInjuryAthleteRef
  status?: string
  details?: EspnInjuryDetail
}

export interface EspnInjuryTeamGroup {
  injuries?: EspnInjuryEntry[]
}

export interface EspnInjuryReportResponse {
  injuries?: EspnInjuryTeamGroup[]
}

export interface ParsedInjury {
  espnAthleteId: string
  injuryStatus: string
  injuryDetail: string | null
}

/** Aplana el reporte de lesiones (agrupado por equipo) en una lista por atleta, descartando entradas sin id o sin status (defensivo ante respuestas parciales de ESPN). */
export function parseEspnInjuryReport(response: EspnInjuryReportResponse): ParsedInjury[] {
  const injuries: ParsedInjury[] = []

  for (const team of response.injuries ?? []) {
    for (const entry of team.injuries ?? []) {
      if (!entry.athlete?.id || !entry.status) continue

      injuries.push({
        espnAthleteId: entry.athlete.id,
        injuryStatus: entry.status,
        injuryDetail: entry.details?.type ?? entry.details?.detail ?? null,
      })
    }
  }

  return injuries
}

/** Enriquece las filas del roster ya parseadas con la designación semanal de lesión, cuando exista un match por espnAthleteId. No modifica nada si `injuries` está vacío (endpoint caído o shape inesperado). */
export function applyInjuryReport(players: ParsedPlayer[], injuries: ParsedInjury[]): ParsedPlayer[] {
  if (injuries.length === 0) return players

  const injuriesByAthleteId = new Map(injuries.map((injury) => [injury.espnAthleteId, injury]))

  return players.map((player) => {
    const injury = injuriesByAthleteId.get(player.espnAthleteId)
    if (!injury) return player

    return { ...player, injuryStatus: injury.injuryStatus, injuryDetail: injury.injuryDetail }
  })
}
