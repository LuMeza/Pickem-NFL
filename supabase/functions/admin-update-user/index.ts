// Edicion de usuario por el administrador (nombre visible y correo).
// Igual que admin-create-user, usa la service role key porque cambiar el
// correo de auth.users exige la Supabase Admin API.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
    return jsonResponse({ error: 'Solo un administrador de plataforma puede editar usuarios' }, 403)
  }

  let body: { userId?: string; displayName?: string; email?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Body invalido' }, 400)
  }

  const userId = body.userId?.trim()
  const displayName = body.displayName?.trim()
  const email = body.email?.trim()
  if (!userId || !displayName || !email) {
    return jsonResponse({ error: 'userId, displayName y email son obligatorios' }, 400)
  }

  const { data: currentProfile, error: currentProfileError } = await adminClient
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle()

  if (currentProfileError || !currentProfile) {
    return jsonResponse({ error: 'No se encontro el usuario' }, 404)
  }

  if (email !== currentProfile.email) {
    const { error: emailUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    })
    if (emailUpdateError) {
      return jsonResponse({ error: `No se pudo actualizar el correo: ${emailUpdateError.message}` }, 400)
    }
  }

  const { error: profileUpdateError } = await adminClient
    .from('profiles')
    .update({ display_name: displayName, email })
    .eq('id', userId)

  if (profileUpdateError) {
    return jsonResponse({ error: `No se pudo actualizar el perfil: ${profileUpdateError.message}` }, 500)
  }

  return jsonResponse({ ok: true }, 200)
})
