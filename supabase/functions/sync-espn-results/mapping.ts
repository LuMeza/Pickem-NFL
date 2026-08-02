// Funciones puras de mapeo/clasificacion (tarea 2.8) — sin llamadas de red,
// para poder probarse aisladas. No usan ninguna API especifica de Deno.

export type InternalWeekType = 'hof' | 'pretemporada' | 'regular' | 'playoffs'

export interface InternalWeek {
  id: string
  type: InternalWeekType
  number: number
}

export interface EspnWeekParams {
  seasontype: 1 | 2 | 3
  week: number
}

/**
 * Mapea una semana interna a los parámetros seasontype/week del scoreboard
 * de ESPN. Verificado contra la API real (2026-07-19):
 * - Preseason: ESPN week 1 = Hall of Fame Game, mapeado por separado como
 *   tipo `hof` (change agregar-semana-hof). "Pre Sem 1/2/3" empiezan en ESPN
 *   week 2, por eso conservan el offset +1.
 * - Regular: coincide 1:1 con nuestro número de semana.
 * - Playoffs: ESPN week 4 es una semana vacia (Pro Bowl); el Super Bowl es
 *   ESPN week 5, no 4. Nuestro número 4 (Super Bowl) mapea a ESPN week 5.
 */
export function espnParamsForWeek(week: InternalWeek): EspnWeekParams {
  if (week.type === 'hof') return { seasontype: 1, week: 1 }
  if (week.type === 'pretemporada') return { seasontype: 1, week: week.number + 1 }
  if (week.type === 'regular') return { seasontype: 2, week: week.number }

  const playoffsWeekMap: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 5 }
  return { seasontype: 3, week: playoffsWeekMap[week.number] ?? week.number }
}

/**
 * Año de temporada NFL para el parámetro `dates` del scoreboard de ESPN. Sin
 * este parámetro, ESPN resuelve a su noción de "temporada actual" de forma
 * inconsistente en offseason (puede devolver la temporada ya terminada en
 * vez de la próxima) — se fuerza explicitamente. Una temporada se nombra por
 * el año en que arranca (ago-dic) y se extiende hasta feb del año siguiente;
 * en enero/febrero seguimos dentro de la temporada del año anterior.
 */
export function nflSeasonYear(now: Date): number {
  const month = now.getUTCMonth() + 1
  const year = now.getUTCFullYear()
  return month <= 2 ? year - 1 : year
}

export type GameOutcome = 'home' | 'away' | 'tie'

/** Clasifica ganador/empate a partir del marcador (más confiable que el flag `winner` de ESPN, que en teoría puede venir false/false en empate). */
export function classifyOutcome(homeScore: number, awayScore: number): GameOutcome {
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  return 'tie'
}

export interface EspnCompetitor {
  team: { abbreviation: string }
  homeAway: 'home' | 'away'
  score?: string
}

export interface EspnEvent {
  id: string
  date: string
  status: { type: { completed: boolean } }
  competitions: Array<{ competitors: EspnCompetitor[] }>
}

export interface ParsedEspnGame {
  espnEventId: string
  kickoffAt: Date
  homeAbbreviation: string
  awayAbbreviation: string
  completed: boolean
  homeScore: number | null
  awayScore: number | null
}

/** Extrae los datos relevantes de un evento del scoreboard, o null si el evento no trae ambos equipos definidos (ej. playoffs con matchup aún no decidido, "TBD"). */
export function parseEspnEvent(event: EspnEvent): ParsedEspnGame | null {
  const competitors = event.competitions[0]?.competitors ?? []
  const home = competitors.find((c) => c.homeAway === 'home')
  const away = competitors.find((c) => c.homeAway === 'away')
  if (!home || !away) return null

  const homeAbbreviation = home.team.abbreviation
  const awayAbbreviation = away.team.abbreviation
  if (!homeAbbreviation || !awayAbbreviation || homeAbbreviation === 'TBD' || awayAbbreviation === 'TBD') {
    return null
  }

  const completed = event.status.type.completed
  const homeScore = completed && home.score !== undefined ? Number(home.score) : null
  const awayScore = completed && away.score !== undefined ? Number(away.score) : null

  return {
    espnEventId: event.id,
    kickoffAt: new Date(event.date),
    homeAbbreviation,
    awayAbbreviation,
    completed,
    homeScore,
    awayScore,
  }
}
