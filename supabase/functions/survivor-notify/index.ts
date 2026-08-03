// Envía los emails pendientes en el outbox `survivor_notifications` (ver
// migración 20260803000000): _survivor_recompute deja una fila ahí cada vez
// que determina el desenlace semanal de un usuario (sigue vivo / eliminado).
// Invocable por un Cron Job (service role key) cada 15 min, mismo patrón que
// sync-espn-results, o por un administrador desde el panel bajo demanda.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/sendEmail.ts'
import { buildSurvivorResultEmailHtml, type SurvivorResultEmailParams } from '../_shared/survivorResultEmail.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://pickem-nfl.vercel.app'
const BATCH_SIZE = 100

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function authorize(req: Request, adminClient: ReturnType<typeof createClient>): Promise<boolean> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return false
  const token = authHeader.replace(/^Bearer\s+/i, '')

  // Llamada de sistema (Cron Job configurado con la service role key).
  if (token === SERVICE_ROLE_KEY) return true

  // Llamada de un usuario (panel admin): debe ser platform_admin.
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

interface PendingNotification {
  id: string
  group_id: string
  user_id: string
  week_id: string
  type: 'alive' | 'eliminated'
  reason: SurvivorResultEmailParams['reason']
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const authorized = await authorize(req, adminClient)
  if (!authorized) {
    return jsonResponse({ error: 'Solo un administrador de plataforma (o el Cron Job) puede notificar' }, 403)
  }

  const { data: pending, error: pendingError } = await adminClient
    .from('survivor_notifications')
    .select('id, group_id, user_id, week_id, type, reason')
    .is('sent_at', null)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (pendingError) {
    return jsonResponse({ error: `No se pudieron leer las notificaciones pendientes: ${pendingError.message}` }, 500)
  }

  const rows = (pending ?? []) as PendingNotification[]
  if (rows.length === 0) {
    return jsonResponse({ processed: 0, sent: 0, errors: [] }, 200)
  }

  const userIds = [...new Set(rows.map((r) => r.user_id))]
  const weekIds = [...new Set(rows.map((r) => r.week_id))]

  const [{ data: profiles }, { data: weeks }, { data: picks }] = await Promise.all([
    adminClient.from('profiles').select('id, display_name, email').in('id', userIds),
    adminClient.from('weeks').select('id, number').in('id', weekIds),
    adminClient
      .from('survivor_picks')
      .select('group_id, user_id, week_id, team_id')
      .in('user_id', userIds)
      .in('week_id', weekIds),
  ])

  const { data: teams } = await adminClient
    .from('teams')
    .select('id, name')
    .in('id', [...new Set((picks ?? []).map((p) => p.team_id))])

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))
  const weekById = new Map((weeks ?? []).map((w) => [w.id, w]))
  const teamById = new Map((teams ?? []).map((t) => [t.id, t]))
  const pickByKey = new Map((picks ?? []).map((p) => [`${p.group_id}:${p.user_id}:${p.week_id}`, p]))

  const errors: string[] = []
  let sentCount = 0

  for (const row of rows) {
    const profile = profileById.get(row.user_id)
    const week = weekById.get(row.week_id)
    const pick = pickByKey.get(`${row.group_id}:${row.user_id}:${row.week_id}`)
    const team = pick ? teamById.get(pick.team_id) : undefined

    if (!profile || !week || !team) {
      errors.push(`Notificacion ${row.id}: faltan datos para armar el correo (perfil/semana/equipo)`)
      await adminClient
        .from('survivor_notifications')
        .update({ error: 'Faltan datos para armar el correo' })
        .eq('id', row.id)
      continue
    }

    const html = buildSurvivorResultEmailHtml({
      displayName: profile.display_name,
      weekNumber: week.number,
      teamName: team.name,
      type: row.type,
      reason: row.reason,
      pickUrl: `${SITE_URL}/survivor/semana/${row.week_id}`,
    })

    const subject =
      row.type === 'alive' ? `Survivor — sigues vivo (semana ${week.number})` : `Survivor — quedaste eliminado (semana ${week.number})`

    const result = await sendEmail({ to: profile.email, subject, html })

    if (result.ok) {
      sentCount += 1
      await adminClient.from('survivor_notifications').update({ sent_at: new Date().toISOString() }).eq('id', row.id)
    } else {
      errors.push(`Notificacion ${row.id} (${profile.email}): ${result.error}`)
      await adminClient.from('survivor_notifications').update({ error: result.error }).eq('id', row.id)
    }
  }

  return jsonResponse({ processed: rows.length, sent: sentCount, errors }, 200)
})
