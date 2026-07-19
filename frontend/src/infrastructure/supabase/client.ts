import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (ver .env.example). ' +
      'Este es el unico archivo del proyecto que debe construir el cliente de Supabase.',
  )
}

export const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)
