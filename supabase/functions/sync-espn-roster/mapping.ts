// Funciones puras de parseo del roster publico de ESPN — sin llamadas de
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
      })
    }
  }

  return players
}
