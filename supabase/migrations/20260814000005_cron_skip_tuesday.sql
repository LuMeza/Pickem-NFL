-- Los martes no hay partidos de NFL, asi que sync-espn-results no tiene nada
-- que sincronizar y survivor-notify no tiene notificaciones nuevas que
-- despachar (dependen de resultados que no van a cambiar ese dia). Se ajusta
-- el schedule para que descansen los martes (dia 2, 0=domingo) y solo corran
-- miercoles a lunes, evitando llamadas innecesarias a la API de ESPN.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'sync-espn-results-every-15-min'),
  schedule := '*/15 * * * 0,1,3,4,5,6'
);

select cron.alter_job(
  (select jobid from cron.job where jobname = 'survivor-notify-every-15-min'),
  schedule := '5,20,35,50 * * * 0,1,3,4,5,6'
);
