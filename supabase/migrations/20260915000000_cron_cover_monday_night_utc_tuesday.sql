-- Fix: 20260814000005 asume que "no hay partidos de NFL los martes" y por
-- eso saltea el dia 2 (martes) completo en el schedule de sync-espn-results
-- y survivor-notify. Ese dia de la semana lo evalua pg_cron en UTC
-- (cron.timezone no esta configurado, default UTC), pero el Monday Night
-- Football arranca ~8:15pm hora del este (UTC-4 en septiembre, con horario
-- de verano) = ~00:15 UTC, ya del lado del "martes" UTC, y puede terminar
-- pasadas las 03:00-04:00 UTC con tiempo extra. Como el martes esta
-- completamente saltado, el resultado del MNF no se sincroniza hasta que
-- arranca el schedule del miercoles (00:00 UTC), casi un dia despues de que
-- termino el partido — que es exactamente el sintoma reportado (semana 1,
-- el ultimo partido del lunes 14 no quedo con ganador/perdedor registrado).
--
-- Se agregan jobs adicionales que SI corren los martes pero solo entre
-- 00:00 y 06:59 UTC (ventana donde puede seguir en curso o recien haber
-- terminado el MNF, con margen para tiempo extra y para que ESPN marque el
-- partido como Final). El resto del martes sigue saltado: ahi si es cierto
-- que no hay nada que sincronizar.
select cron.schedule(
  'sync-espn-results-tuesday-early-utc',
  '*/15 0-6 * * 2',
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

select cron.schedule(
  'survivor-notify-tuesday-early-utc',
  '5,20,35,50 0-6 * * 2',
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
