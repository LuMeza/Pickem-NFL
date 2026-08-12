// Sincroniza la plantilla ("roster") de cada equipo desde el sitio público
// (no oficial) de ESPN. Invocable por un administrador desde el panel (boton
// "Sincronizar plantillas") — mismo patron que sync-espn-results.
//
// Estrategia "reemplazo completo": se borra el roster actual y se inserta el
// roster fresco de los 32 equipos en un solo batch. Es más simple que hacer
// diff altas/bajas/traspasos jugador por jugador, y el roster de un equipo
// solo se usa para mostrarlo (no hay relaciones de otras tablas hacia
// players que se puedan romper con un id que cambie).
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  applyInjuryReport,
  parseEspnInjuryReport,
  parseEspnRoster,
  type EspnInjuryReportResponse,
  type EspnRosterResponse,
  type ParsedInjury,
} from './mapping.ts'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ESPN_TEAM_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams'
const ESPN_INJURY_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries'

/** Trae el reporte de lesiones semanal (Questionable/Doubtful/Out) de toda la liga en una sola llamada. No bloqueante: si ESPN cambia el shape o el endpoint falla, el sync de roster sigue igual, solo que sin designación semanal (mismo comportamiento que hoy). */
async function fetchInjuryReport(): Promise<{ injuries: ParsedInjury[]; error: string | null }> {
  try {
    const response = await fetch(ESPN_INJURY_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const body = (await response.json()) as EspnInjuryReportResponse
    return { injuries: parseEspnInjuryReport(body), error: null }
  } catch (fetchErr) {
    return { injuries: [], error: `No se pudo obtener el reporte de lesiones (roster se sincronizó igual): ${String(fetchErr)}` }
  }
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface RosterSyncSummary {
  teamsProcessed: number
  playersSynced: number
  injuriesMatched: number
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const authorized = await authorize(req, adminClient)
  if (!authorized) {
    return jsonResponse({ error: 'Solo un administrador de plataforma (o el Cron Job) puede sincronizar' }, 403)
  }

  const summary: RosterSyncSummary = { teamsProcessed: 0, playersSynced: 0, injuriesMatched: 0, errors: [] }

  const { data: teams, error: teamsError } = await adminClient.from('teams').select('id, espn_abbreviation')
  if (teamsError || !teams) {
    return jsonResponse({ error: `No se pudieron leer los equipos: ${teamsError?.message}` }, 500)
  }

  const { injuries, error: injuryError } = await fetchInjuryReport()
  if (injuryError) summary.errors.push(injuryError)

  const rowsToInsert: {
    id: string
    team_id: string
    full_name: string
    position: string | null
    jersey_number: string | null
    unit: string | null
    height_in: number | null
    weight_lbs: number | null
    birth_date: string | null
    age: number | null
    college: string | null
    experience_years: number | null
    status: string | null
    injury_status: string | null
    injury_detail: string | null
  }[] = []

  for (const team of teams as { id: string; espn_abbreviation: string | null }[]) {
    const abbreviation = team.espn_abbreviation ?? team.id
    const url = `${ESPN_TEAM_URL}/${abbreviation}/roster`

    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const body = (await response.json()) as EspnRosterResponse
      const players = applyInjuryReport(parseEspnRoster(body), injuries)

      for (const player of players) {
        if (player.injuryStatus) summary.injuriesMatched += 1

        rowsToInsert.push({
          id: player.espnAthleteId,
          team_id: team.id,
          full_name: player.fullName,
          position: player.position,
          jersey_number: player.jerseyNumber,
          unit: player.unit,
          height_in: player.heightIn,
          weight_lbs: player.weightLbs,
          birth_date: player.birthDate,
          age: player.age,
          college: player.college,
          experience_years: player.experienceYears,
          status: player.status,
          injury_status: player.injuryStatus,
          injury_detail: player.injuryDetail,
        })
      }
      summary.teamsProcessed += 1
    } catch (fetchErr) {
      summary.errors.push(`Equipo ${team.id}: fallo al consultar ESPN (${String(fetchErr)})`)
    }
  }

  if (rowsToInsert.length === 0) {
    summary.errors.push('No se obtuvo ningún jugador de ESPN; no se toco la plantilla existente.')
    return jsonResponse(summary, 200)
  }

  const { error: deleteError } = await adminClient.from('players').delete().not('id', 'is', null)
  if (deleteError) {
    return jsonResponse({ error: `No se pudo limpiar la plantilla anterior: ${deleteError.message}` }, 500)
  }

  const { error: insertError } = await adminClient.from('players').insert(rowsToInsert)
  if (insertError) {
    summary.errors.push(`No se pudo guardar la plantilla nueva: ${insertError.message}`)
  } else {
    summary.playersSynced = rowsToInsert.length
  }

  return jsonResponse(summary, 200)
})
