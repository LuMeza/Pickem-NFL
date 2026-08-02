// Headers CORS compartidos por todas las Edge Functions invocadas desde el
// navegador. Sin esto, el preflight OPTIONS que manda el navegador antes de
// cada POST (porque Supabase manda Content-Type/Authorization) llega al
// handler de la función, que lo rechaza como "Method not allowed".
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
