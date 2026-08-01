-- Feedback de producto (post-implementacion, ver design.md decision 8): no
-- se debe poder elegir equipo en una semana regular futura antes de que la
-- semana actual se resuelva — antes solo se bloqueaba por kickoff de esa
-- misma semana, permitiendo saltar adelante sin saber si el usuario sigue
-- vivo. survivor_current_week_number() es la misma condicion de corte que ya
-- usa _survivor_recompute para su loop (primera semana regular sin partidos
-- cargados o con algun resultado pendiente), expuesta para reutilizarla aca
-- y desde el frontend (WeekSelector).
create or replace function public.survivor_current_week_number()
returns int
language sql
security definer
set search_path = public
stable
as $$
  select min(w.number)
  from public.weeks w
  where w.type = 'regular'
    and (
      not exists (select 1 from public.games g where g.week_id = w.id)
      or exists (select 1 from public.games g where g.week_id = w.id and g.outcome is null)
    );
$$;

comment on function public.survivor_current_week_number() is
  'Numero de la semana regular actualmente abierta (sin resolver del todo). Null si todas las semanas regulares ya se resolvieron.';

-- Tarea 1.4 actualizada: ademas de no estar eliminado y de que el partido no
-- haya iniciado, ahora tambien exige (a) que el usuario no este esperando
-- resolucion de una solicitud de vida sin enviar (design.md decision 7) y (b)
-- que la semana no sea posterior a la semana actual abierta (decision 8).
create or replace function public.can_pick_survivor_team(p_group_id uuid, p_uid uuid, p_week_id uuid, p_team_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    not exists (
      select 1 from public.survivor_state ss
      where ss.group_id = p_group_id and ss.user_id = p_uid and ss.status in ('eliminated', 'needs_life_request')
    )
    and exists (
      select 1
      from public.games g
      join public.weeks w on w.id = g.week_id
      where g.week_id = p_week_id
        and (g.home_team_id = p_team_id or g.away_team_id = p_team_id)
        and w.type = 'regular'
        and now() < g.kickoff_at
        and w.number <= coalesce(public.survivor_current_week_number(), w.number)
    );
$$;

comment on function public.can_pick_survivor_team(uuid, uuid, uuid, text) is
  'True si p_uid puede elegir p_team_id en p_week_id para Survivor: no esta eliminado ni esperando enviar una solicitud de vida, la semana es regular y no posterior a la semana actual abierta, el equipo tiene partido esa semana y no ha iniciado.';
