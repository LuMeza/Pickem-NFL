// Tareas 2.1-2.7 (integracion-resultados-espn): sincroniza calendario y
// resultados desde el scoreboard público (no oficial) de ESPN. Invocable por
// un administrador desde el panel (boton "Sincronizar con ESPN") o por un
// Cron Job de Supabase configurado desde el dashboard (ver tarea 3.1) — en
// ese caso la Authorization es la service role key directamente, no un JWT
// de usuario.
//
// Las queries van por lote (una lectura de partidos existentes por semana,
// un insert masivo de partidos nuevos) en vez de una consulta por partido:
// con ~400 partidos en 26 semanas, ir partido por partido excedia el tiempo
// de ejecucion de la Edge Function.
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  classifyOutcome,
  espnParamsForWeek,
  nflSeasonYear,
  parseEspnEvent,
  type EspnEvent,
  type InternalWeek,
} from './mapping.ts'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
const SEASON_YEAR = nflSeasonYear(new Date())

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface SyncSummary {
  weeksProcessed: number
  gamesCreated: number
  resultsUpdated: number
  errors: string[]
}

async function authorize(req: Request, adminClient: ReturnType<typeof createClient>): Promise<boolean> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return false
  const token = authHeader.replace(/^Bearer\s+/i, '')

  // Llamada de sistema (Cron Job configurado con la service role key).
  if (token === SERVICE_ROLE_KEY) return true

  // Llamada de un usuario (boton del panel admin): debe ser platform_admin.
  const callerClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
  } = await callerClient.auth.getUser()
  if (!user) return false

  const { data: adminRow } = await adminClient
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  return adminRow !== null
}

interface ExistingGameRow {
  id: string
  home_team_id: string
  away_team_id: string
  espn_event_id: string | null
  result_source: string | null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const authorized = await authorize(req, adminClient)
  if (!authorized) {
    return jsonResponse({ error: 'Solo un administrador de plataforma (o el Cron Job) puede sincronizar' }, 403)
  }

  const summary: SyncSummary = { weeksProcessed: 0, gamesCreated: 0, resultsUpdated: 0, errors: [] }

  const { data: weeks, error: weeksError } = await adminClient
    .from('weeks')
    .select('id, type, number')
    .order('sort_order')
  if (weeksError || !weeks) {
    return jsonResponse({ error: `No se pudieron leer las semanas: ${weeksError?.message}` }, 500)
  }

  const { data: teams, error: teamsError } = await adminClient.from('teams').select('id, espn_abbreviation')
  if (teamsError || !teams) {
    return jsonResponse({ error: `No se pudieron leer los equipos: ${teamsError?.message}` }, 500)
  }
  const teamIdByEspnAbbreviation = new Map<string, string>(
    teams.filter((t) => t.espn_abbreviation).map((t) => [t.espn_abbreviation as string, t.id as string]),
  )

  for (const week of weeks as InternalWeek[]) {
    const { seasontype, week: espnWeek } = espnParamsForWeek(week)
    const url = `${ESPN_SCOREBOARD_URL}?seasontype=${seasontype}&week=${espnWeek}&dates=${SEASON_YEAR}`

    let events: EspnEvent[]
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const body = await response.json()
      events = body.events ?? []
    } catch (fetchErr) {
      summary.errors.push(`Semana ${week.type} ${week.number}: fallo al consultar ESPN (${String(fetchErr)})`)
      continue
    }

    summary.weeksProcessed += 1
    if (events.length === 0) continue

    const { data: existingGames, error: existingError } = await adminClient
      .from('games')
      .select('id, home_team_id, away_team_id, espn_event_id, result_source')
      .eq('week_id', week.id)
    if (existingError) {
      summary.errors.push(`Semana ${week.type} ${week.number}: no se pudieron leer partidos existentes (${existingError.message})`)
      continue
    }

    const byEspnId = new Map<string, ExistingGameRow>()
    const byMatchup = new Map<string, ExistingGameRow>()
    for (const row of existingGames as ExistingGameRow[]) {
      if (row.espn_event_id) byEspnId.set(row.espn_event_id, row)
      byMatchup.set(`${row.home_team_id}|${row.away_team_id}`, row)
    }

    const rowsToInsert: {
      week_id: string
      home_team_id: string
      away_team_id: string
      kickoff_at: string
      espn_event_id: string
      outcome?: 'home' | 'away' | 'tie'
      home_score?: number
      away_score?: number
      result_source?: 'auto_sync'
    }[] = []
    const resultUpdates: {
      id: string
      outcome: 'home' | 'away' | 'tie'
      home_score: number
      away_score: number
    }[] = []
    const espnIdBackfills: { id: string; espn_event_id: string }[] = []

    for (const event of events) {
      const parsed = parseEspnEvent(event)
      if (!parsed) continue

      const homeTeamId = teamIdByEspnAbbreviation.get(parsed.homeAbbreviation)
      const awayTeamId = teamIdByEspnAbbreviation.get(parsed.awayAbbreviation)
      if (!homeTeamId || !awayTeamId) {
        summary.errors.push(`Evento ${parsed.espnEventId}: equipo sin mapear (${parsed.homeAbbreviation}/${parsed.awayAbbreviation})`)
        continue
      }

      const existing = byEspnId.get(parsed.espnEventId) ?? byMatchup.get(`${homeTeamId}|${awayTeamId}`)

      if (!existing) {
        const hasResult = parsed.completed && parsed.homeScore !== null && parsed.awayScore !== null
        rowsToInsert.push({
          week_id: week.id,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          kickoff_at: parsed.kickoffAt.toISOString(),
          espn_event_id: parsed.espnEventId,
          ...(hasResult
            ? {
                outcome: classifyOutcome(parsed.homeScore as number, parsed.awayScore as number),
                home_score: parsed.homeScore as number,
                away_score: parsed.awayScore as number,
                result_source: 'auto_sync' as const,
              }
            : {}),
        })
        if (hasResult) summary.resultsUpdated += 1
        continue
      }

      if (!existing.espn_event_id) {
        espnIdBackfills.push({ id: existing.id, espn_event_id: parsed.espnEventId })
      }

      const isManual = existing.result_source === 'manual'
      if (!isManual && parsed.completed && parsed.homeScore !== null && parsed.awayScore !== null) {
        resultUpdates.push({
          id: existing.id,
          outcome: classifyOutcome(parsed.homeScore, parsed.awayScore),
          home_score: parsed.homeScore,
          away_score: parsed.awayScore,
        })
      }
    }

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await adminClient.from('games').insert(rowsToInsert)
      if (insertError) {
        summary.errors.push(`Semana ${week.type} ${week.number}: no se pudieron crear ${rowsToInsert.length} partido(s) (${insertError.message})`)
      } else {
        summary.gamesCreated += rowsToInsert.length
      }
    }

    for (const backfill of espnIdBackfills) {
      await adminClient.from('games').update({ espn_event_id: backfill.espn_event_id }).eq('id', backfill.id)
    }

    for (const update of resultUpdates) {
      // La precedencia de la carga manual la impone el trigger
      // games_manual_precedence (base-plataforma) — este UPDATE es un
      // no-op silencioso si el resultado ya fue cargado a mano.
      const { error: updateError } = await adminClient
        .from('games')
        .update({
          outcome: update.outcome,
          home_score: update.home_score,
          away_score: update.away_score,
          result_source: 'auto_sync',
        })
        .eq('id', update.id)
      if (updateError) {
        summary.errors.push(`Partido ${update.id}: no se pudo actualizar el resultado (${updateError.message})`)
      } else {
        summary.resultsUpdated += 1
      }
    }
  }

  return jsonResponse(summary, 200)
})
