// Reenvío del correo de bienvenida por el administrador. Genera una nueva
// contraseña provisional (la original no queda guardada en ningún lado, ver
// admin-create-user), la aplica al usuario y reenvía el correo.
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
    return jsonResponse({ error: 'Solo un administrador de plataforma puede reenviar el correo de bienvenida' }, 403)
  }

  let body: { userId?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Body invalido' }, 400)
  }

  const userId = body.userId?.trim()
  if (!userId) {
    return jsonResponse({ error: 'userId es obligatorio' }, 400)
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('display_name, email')
    .eq('id', userId)
    .maybeSingle()

  if (profileError || !profile) {
    return jsonResponse({ error: 'No se encontro el usuario' }, 404)
  }

  const provisionalPassword = generateProvisionalPassword()

  const { error: updatePasswordError } = await adminClient.auth.admin.updateUserById(userId, {
    password: provisionalPassword,
  })
  if (updatePasswordError) {
    return jsonResponse({ error: `No se pudo generar la nueva contraseña: ${updatePasswordError.message}` }, 400)
  }

  const { error: mustChangeError } = await adminClient
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', userId)
  if (mustChangeError) {
    return jsonResponse({ error: `No se pudo actualizar el perfil: ${mustChangeError.message}` }, 500)
  }

  const emailResult = await sendEmail({
    to: profile.email as string,
    subject: 'Bienvenido a Pickem NFL — tu acceso',
    html: buildWelcomeEmailHtml({
      displayName: profile.display_name as string,
      email: profile.email as string,
      provisionalPassword,
      loginUrl: `${SITE_URL}/login`,
    }),
  })
  if (!emailResult.ok) {
    console.error(`No se pudo reenviar el correo de bienvenida a ${profile.email}: ${emailResult.error}`)
  }

  return jsonResponse({ userId, provisionalPassword, emailSent: emailResult.ok }, 200)
})
