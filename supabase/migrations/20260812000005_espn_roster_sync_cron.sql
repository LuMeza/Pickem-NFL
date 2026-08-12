-- Programa la sincronizacion automatica de plantillas (roster + reporte de
-- lesiones) via pg_cron + pg_net, mismo patron que sync-espn-results (ver
-- 20260802000000_espn_sync_cron.sql). Se corre 1 vez por dia -- a diferencia
-- de resultados, el roster y el reporte de lesiones no cambian partido a
-- partido, con una corrida diaria alcanza para mantenerlos al dia.
--
-- timeout_milliseconds mas alto que el de resultados: sync-espn-roster
-- recorre 32 equipos + el reporte de lesiones de liga completa y reemplaza
-- toda la tabla players, lo que puede tardar hasta ~2 minutos (ver
-- AdminSyncPage.tsx).
--
-- El service role key se lee de Supabase Vault (secreto "service_role_key",
-- ya creado para el cron de sync-espn-results) -- no vive en esta migracion.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'sync-espn-roster-daily',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://ddxpspoufmdlkbuwbxpe.supabase.co/functions/v1/sync-espn-roster',
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
    timeout_milliseconds := 150000
  ) as request_id;
  $$
);
