-- Fix: la primera corrida del cron (20260802000000) dio timeout porque
-- net.http_post usa 5000ms por defecto y sync-espn-results recorre 25
-- semanas de ESPN, lo cual tarda mas que eso. cron.schedule con el mismo
-- nombre de job reemplaza la definicion anterior (no crea un duplicado).

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
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) as request_id;
  $$
);
