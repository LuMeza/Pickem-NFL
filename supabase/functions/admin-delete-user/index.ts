// Baja de usuario por el administrador. Borra auth.users; profiles y
// group_members caen en cascada (FK on delete cascade, ver migraciones).
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
    return jsonResponse({ error: 'Solo un administrador de plataforma puede eliminar usuarios' }, 403)
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

  if (userId === callerUser.id) {
    return jsonResponse({ error: 'No puedes eliminar tu propia cuenta de administrador' }, 400)
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
  if (deleteError) {
    return jsonResponse({ error: `No se pudo eliminar el usuario: ${deleteError.message}` }, 400)
  }

  return jsonResponse({ ok: true }, 200)
})
