// Avisa por correo al jugador cuando un admin aprueba su solicitud de
// acceso a una semana de Pickem Semanal. Invocada exclusivamente por el
// trigger de Postgres en weekly_access via pg_net (ver
// supabase/migrations/20260811000003_weekly_access_approved_notify_trigger.sql),
// nunca desde el navegador — mismo patrón que notify-access-request.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/sendEmail.ts'
import { buildWeeklyAccessApprovedEmailHtml } from '../_shared/weeklyAccessApprovedEmail.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://pickem-nfl.vercel.app'

// Replica frontend/src/presentation/features/pickem/weekLabel.ts — no hay
// forma de compartir código entre el frontend (Vite) y las Edge Functions (Deno).
const PLAYOFFS_ROUND_LABEL: Record<number, string> = {
  1: 'Wild Card',
  2: 'Divisional',
  3: 'Conference',
  4: 'Super Bowl',
}

function weekLabel(week: { type: string; number: number }): string {
  if (week.type === 'playoffs') return PLAYOFFS_ROUND_LABEL[week.number] ?? `Ronda ${week.number}`
  if (week.type === 'hof') return 'Hall of Fame'
  if (week.type === 'pretemporada') return `Pre ${week.number}`
  return `Semana ${week.number}`
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface NotifyBody {
  userId?: string
  weekId?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // Solo el trigger de Postgres (via pg_net, con la service role key) puede
  // llamar esta función — no hay un caso de uso donde el navegador la invoque.
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (token !== SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'Esta función solo puede ser invocada por el sistema' }, 403)
  }

  let body: NotifyBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Body inválido' }, 400)
  }

  if (!body.userId || !body.weekId) {
    return jsonResponse({ error: 'userId y weekId son obligatorios' }, 400)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: profile } = await adminClient
    .from('profiles')
    .select('display_name, email')
    .eq('id', body.userId)
    .maybeSingle()

  if (!profile?.email) {
    return jsonResponse({ error: 'No se encontró el perfil del jugador' }, 404)
  }

  const { data: week } = await adminClient.from('weeks').select('type, number').eq('id', body.weekId).maybeSingle()

  const label = week ? weekLabel(week) : 'tu semana'
  const pickUrl = `${SITE_URL}/weeks/${body.weekId}/games`

  const result = await sendEmail({
    to: profile.email,
    subject: `Acceso aprobado — ${label}`,
    html: buildWeeklyAccessApprovedEmailHtml({
      displayName: profile.display_name ?? 'Jugador',
      weekLabel: label,
      pickUrl,
    }),
  })

  if (!result.ok) {
    console.error(`No se pudo enviar el correo de aprobación a ${profile.email}: ${result.error}`)
    return jsonResponse({ emailSent: false, error: result.error }, 200)
  }

  return jsonResponse({ emailSent: true }, 200)
})
