// Tarea 2.3 (espn-game-predictions): sincroniza el pronóstico de victoria
// ("Matchup Predictor" de ESPN) de los partidos próximos. Invocable por un
// administrador desde el panel (boton "Sincronizar pronósticos") o por el
// Cron Job — mismo patron de autorización que sync-espn-results.
//
// Función aparte de sync-espn-results a propósito (design.md decisión 1):
// requiere una llamada a `summary` por partido y no debe agregar latencia ni
// puntos de falla a la sincronización de resultados.
//
// Solo se consultan partidos sin resultado con kickoff entre ahora y 8 días:
// la condición kickoff > now() es la que congela el pronóstico al kickoff
// (después ya no se vuelve a escribir su fila).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { parseEspnPrediction, type EspnSummaryResponse } from './mapping.ts'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// Mismo dominio que sync-espn-results/sync-espn-roster: site.api.espn.com
// está bloqueado por Akamai.
const ESPN_SUMMARY_URL = 'https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/summary'
const LOOKAHEAD_DAYS = 8
const CONCURRENCY = 4

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface PredictionSyncSummary {
  gamesConsidered: number
  predictionsUpdated: number
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

interface UpcomingGameRow {
  id: string
  espn_event_id: string
}

interface PredictionRow {
  game_id: string
  source: 'espn_fpi'
  home_win_pct: number
  away_win_pct: number
  home_spread: number | null
  over_under: number | null
  fetched_at: string
}

async function fetchPrediction(game: UpcomingGameRow): Promise<PredictionRow | string> {
  try {
    const response = await fetch(`${ESPN_SUMMARY_URL}?event=${game.espn_event_id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const parsed = parseEspnPrediction((await response.json()) as EspnSummaryResponse)
    if (!parsed) return `Evento ${game.espn_event_id}: ESPN no publica pronóstico todavía`
    return {
      game_id: game.id,
      source: 'espn_fpi',
      home_win_pct: parsed.homeWinPct,
      away_win_pct: parsed.awayWinPct,
      home_spread: parsed.homeSpread,
      over_under: parsed.overUnder,
      fetched_at: new Date().toISOString(),
    }
  } catch (fetchErr) {
    return `Evento ${game.espn_event_id}: fallo al consultar ESPN (${String(fetchErr)})`
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const authorized = await authorize(req, adminClient)
  if (!authorized) {
    return jsonResponse({ error: 'Solo un administrador de plataforma (o el Cron Job) puede sincronizar' }, 403)
  }

  const now = new Date()
  const until = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000)
  const { data: games, error: gamesError } = await adminClient
    .from('games')
    .select('id, espn_event_id')
    .is('outcome', null)
    .not('espn_event_id', 'is', null)
    .gt('kickoff_at', now.toISOString())
    .lte('kickoff_at', until.toISOString())
  if (gamesError || !games) {
    return jsonResponse({ error: `No se pudieron leer los partidos próximos: ${gamesError?.message}` }, 500)
  }

  const summary: PredictionSyncSummary = { gamesConsidered: games.length, predictionsUpdated: 0, errors: [] }
  const rows: PredictionRow[] = []

  // Lotes de CONCURRENCY llamadas en paralelo: ~16 partidos por semana, sin
  // golpear a ESPN con todas a la vez.
  const upcoming = games as UpcomingGameRow[]
  for (let i = 0; i < upcoming.length; i += CONCURRENCY) {
    const results = await Promise.all(upcoming.slice(i, i + CONCURRENCY).map(fetchPrediction))
    for (const result of results) {
      if (typeof result === 'string') summary.errors.push(result)
      else rows.push(result)
    }
  }

  if (rows.length > 0) {
    const { error: upsertError } = await adminClient
      .from('game_predictions')
      .upsert(rows, { onConflict: 'game_id,source' })
    if (upsertError) {
      summary.errors.push(`No se pudieron guardar ${rows.length} pronóstico(s) (${upsertError.message})`)
    } else {
      summary.predictionsUpdated = rows.length
    }
  }

  return jsonResponse(summary, 200)
})
