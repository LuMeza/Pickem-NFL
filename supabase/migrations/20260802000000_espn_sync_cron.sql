-- Tarea 3.1 de integracion-resultados-espn: programa la sincronizacion
-- automatica de resultados ESPN via pg_cron + pg_net en vez de configurarla
-- a mano desde el dashboard (Database -> Cron Jobs), que internamente usa
-- la misma extension.
--
-- El service role key NO vive en esta migracion: se lee en tiempo de
-- ejecucion desde Supabase Vault (secreto "service_role_key"), que se crea
-- una sola vez a mano en el SQL Editor del dashboard (ver instrucciones
-- entregadas fuera de este archivo). Si el secreto no existe todavia, el
-- job simplemente falla en cada corrida (visible en cron.job_run_details)
-- hasta que se cree; no bloquea nada mas de la app.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'sync-espn-results-every-15-min',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://ddxpspoufmdlkbuwbxpe.supabase.co/functions/v1/sync-espn-results',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'service_role_key'
        limit 1
      )
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
