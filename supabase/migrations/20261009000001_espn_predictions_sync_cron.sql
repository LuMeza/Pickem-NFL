-- Tarea 6.1 (espn-game-predictions): sincronización automática de
-- pronósticos via pg_cron + pg_net, mismo patron que sync-espn-roster (ver
-- 20260812000005_espn_roster_sync_cron.sql). Cada 6 horas alcanza: el
-- pronóstico cambia lento (lesiones, líneas), y si no hay partidos en los
-- próximos 8 días la corrida no llama a ESPN.
--
-- El service role key se lee de Supabase Vault (secreto "service_role_key",
-- ya creado para el cron de sync-espn-results) -- no vive en esta migracion.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'sync-espn-predictions',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := 'https://ddxpspoufmdlkbuwbxpe.supabase.co/functions/v1/sync-espn-predictions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'service_role_key'
        limit 1
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) as request_id;
  $$
);
