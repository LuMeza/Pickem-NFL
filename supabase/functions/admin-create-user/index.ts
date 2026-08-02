// Tarea 4.1 (base-plataforma): alta de usuario por el administrador.
// Única función del proyecto que usa la service role key (Supabase Admin API)
// — ver design.md decision 3 y Risks/Trade-offs. Verifica que quien llama
// está en platform_admins ANTES de usarla.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/sendEmail.ts'
import { buildWelcomeEmailHtml } from '../_shared/welcomeEmail.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://pickem-nfl.vercel.app'

function generateProvisionalPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, '').slice(0, 14) + 'A1!'
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Falta el header Authorization' }, 401)
  }

  // Cliente "en nombre del usuario" (anon key + su JWT) solo para saber quien
  // llama; nunca se usa para escribir con privilegios elevados.
  const callerClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user: callerUser },
    error: callerError,
  } = await callerClient.auth.getUser()

  if (callerError || !callerUser) {
    return jsonResponse({ error: 'No se pudo identificar al usuario que llama' }, 401)
  }

  // Cliente con service role: único punto del sistema que la usa, y solo
  // después de confirmar que el llamador es administrador de plataforma.
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: adminRow, error: adminCheckError } = await adminClient
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', callerUser.id)
    .maybeSingle()

  if (adminCheckError) {
    return jsonResponse({ error: 'No se pudo verificar el permiso de administrador' }, 500)
  }
  if (!adminRow) {
    return jsonResponse({ error: 'Solo un administrador de plataforma puede dar de alta usuarios' }, 403)
  }

  let body: { email?: string; displayName?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Body invalido' }, 400)
  }

  const email = body.email?.trim()
  const displayName = body.displayName?.trim()
  if (!email || !displayName) {
    return jsonResponse({ error: 'email y displayName son obligatorios' }, 400)
  }

  const provisionalPassword = generateProvisionalPassword()

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: provisionalPassword,
    email_confirm: true,
  })

  if (createError || !created.user) {
    return jsonResponse({ error: `No se pudo crear el usuario: ${createError?.message ?? 'error desconocido'}` }, 400)
  }

  const { error: profileError } = await adminClient.from('profiles').insert({
    id: created.user.id,
    display_name: displayName,
    email,
    must_change_password: true,
  })

  if (profileError) {
    // Revertimos el alta en auth para no dejar un usuario sin perfil.
    await adminClient.auth.admin.deleteUser(created.user.id)
    return jsonResponse({ error: `No se pudo crear el perfil: ${profileError.message}` }, 500)
  }

  // Grupo único global (simplificacion de producto, ver specs/grupos-privados):
  // todo usuario nuevo queda agregado automáticamente, sin flujo de invitación.
  const { data: defaultGroup, error: groupLookupError } = await adminClient
    .from('groups')
    .select('id')
    .order('created_at')
    .limit(1)
    .maybeSingle()

  if (groupLookupError || !defaultGroup) {
    await adminClient.auth.admin.deleteUser(created.user.id)
    return jsonResponse({ error: 'No se encontro el grupo único de la plataforma' }, 500)
  }

  const { error: membershipError } = await adminClient
    .from('group_members')
    .insert({ group_id: defaultGroup.id, user_id: created.user.id })

  if (membershipError) {
    await adminClient.auth.admin.deleteUser(created.user.id)
    return jsonResponse({ error: `No se pudo agregar al usuario al grupo: ${membershipError.message}` }, 500)
  }

  const emailResult = await sendEmail({
    to: email,
    subject: 'Bienvenido a Pickem NFL — tu acceso',
    html: buildWelcomeEmailHtml({
      displayName,
      email,
      provisionalPassword,
      loginUrl: `${SITE_URL}/login`,
    }),
  })
  if (!emailResult.ok) {
    console.error(`No se pudo enviar el correo de bienvenida a ${email}: ${emailResult.error}`)
  }

  return jsonResponse({ userId: created.user.id, provisionalPassword, emailSent: emailResult.ok }, 200)
})
