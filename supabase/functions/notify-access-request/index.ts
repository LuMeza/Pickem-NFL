// Avisa por correo a todos los platform_admins cuando alguien solicita acceso
// a Survivor o Playoffs (module_access). Invocada exclusivamente por el
// trigger de Postgres en module_access via pg_net (ver
// supabase/migrations/20260802000003_access_request_notify_trigger.sql),
// nunca desde el navegador — por eso solo acepta la service role key como
// Authorization, igual que el camino "cron" de sync-espn-results.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/sendEmail.ts'
import { buildAccessRequestEmailHtml } from '../_shared/accessRequestEmail.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://pickem-nfl.vercel.app'

const MODULE_LABELS: Record<string, string> = {
  survivor: 'Survivor',
  playoffs: 'Playoffs',
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface NotifyBody {
  source?: 'module_access'
  module?: 'survivor' | 'playoffs'
  groupId?: string
  userId?: string
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

  if (!body.module || !body.groupId || !body.userId) {
    return jsonResponse({ error: 'module, groupId y userId son obligatorios' }, 400)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: requester } = await adminClient
    .from('profiles')
    .select('display_name')
    .eq('id', body.userId)
    .maybeSingle()

  const moduleLabel = MODULE_LABELS[body.module] ?? body.module

  // platform_admins.user_id referencia auth.users, no profiles: no hay FK
  // directa que PostgREST pueda usar para un embed, así que van dos consultas.
  const { data: adminRows } = await adminClient.from('platform_admins').select('user_id')
  const adminIds = (adminRows ?? []).map((row) => row.user_id as string)

  const { data: adminProfiles } =
    adminIds.length > 0
      ? await adminClient.from('profiles').select('email').in('id', adminIds)
      : { data: [] as { email: string }[] }

  const adminEmails = (adminProfiles ?? []).map((row) => row.email).filter((email): email is string => !!email)

  const reviewUrl = `${SITE_URL}/admin/access-requests`

  const results = await Promise.all(
    adminEmails.map((email) =>
      sendEmail({
        to: email,
        subject: `Nueva solicitud de acceso — ${moduleLabel}`,
        html: buildAccessRequestEmailHtml({
          requesterName: requester?.display_name ?? 'Un jugador',
          moduleLabel,
          reviewUrl,
        }),
      }),
    ),
  )

  const emailsSent = results.filter((result) => result.ok).length
  const errors = results.filter((result): result is { ok: false; error: string } => !result.ok).map((r) => r.error)
  if (errors.length > 0) {
    console.error(`No se pudieron enviar ${errors.length} correo(s) de solicitud de acceso: ${errors.join('; ')}`)
  }

  return jsonResponse({ adminsFound: adminEmails.length, emailsSent }, 200)
})
