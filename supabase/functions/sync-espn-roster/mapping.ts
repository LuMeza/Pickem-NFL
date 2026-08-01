// Funciones puras de parseo del roster publico de ESPN — sin llamadas de
// red, para poder probarse aisladas (mismo patron que sync-espn-results).

export interface EspnRosterAthleteItem {
  id?: string
  fullName?: string
  jersey?: string
  position?: { abbreviation?: string }
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
      })
    }
  }

  return players
}
