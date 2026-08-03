-- Programa survivor-notify cada 15 min (offset 5 min respecto al cron de
-- sync-espn-results, ver 20260802000001) para vaciar el outbox
-- survivor_notifications que deja _survivor_recompute. Mismo mecanismo
-- pg_cron + pg_net + Vault ya usado para el sync de ESPN — ver esa migracion
-- para el detalle de por que el secreto no vive en texto plano aca.
select cron.schedule(
  'survivor-notify-every-15-min',
  '5,20,35,50 * * * *',
  $$
  select net.http_post(
    url := 'https://ddxpspoufmdlkbuwbxpe.supabase.co/functions/v1/survivor-notify',
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
