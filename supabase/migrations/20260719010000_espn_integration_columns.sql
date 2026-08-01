-- Tareas 1.1 y 1.2 (integracion-resultados-espn): columnas de mapeo con el
-- scoreboard publico de ESPN. Nullable y aditivas — no rompen datos existentes.
-- Verificado contra la API real: los ids internos coinciden exactamente con
-- las abreviaciones de ESPN salvo Washington (WAS interno vs WSH en ESPN).
alter table public.teams
  add column if not exists espn_abbreviation text;

update public.teams set espn_abbreviation = id where espn_abbreviation is null;
update public.teams set espn_abbreviation = 'WSH' where id = 'WAS';

alter table public.games
  add column if not exists espn_event_id text;

create unique index if not exists games_espn_event_id_idx
  on public.games (espn_event_id)
  where espn_event_id is not null;
