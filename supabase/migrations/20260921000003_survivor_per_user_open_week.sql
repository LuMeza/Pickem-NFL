-- Antes la semana "abierta" de Survivor era global: la primera semana con algun
-- partido sin resultado. Asi la semana 3 seguia bloqueada para todos hasta que
-- terminara el ultimo partido de la semana 2 (Monday Night), aunque el equipo
-- de un jugador ya hubiera jugado. Ahora es por usuario: cada quien puede
-- pickear la semana siguiente en cuanto se define SU partido de la semana
-- anterior (gano -> sigue; perdio -> puede usar su ventana de revivir).
--
-- Una semana esta "resuelta para el usuario" si su equipo ya tiene resultado, o
-- si no eligio equipo y ya arranco la semana (ya no puede elegir).
create or replace function public._survivor_open_week_number(p_uid uuid)
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
      or not (
        exists (
          select 1
          from public.survivor_picks sp
          join public.games g
            on g.week_id = sp.week_id and (g.home_team_id = sp.team_id or g.away_team_id = sp.team_id)
          where sp.user_id = p_uid and sp.week_id = w.id and g.outcome is not null
        )
        or (
          not exists (select 1 from public.survivor_picks sp where sp.user_id = p_uid and sp.week_id = w.id)
          and public.week_kickoff_started(w.id)
        )
      )
    );
$$;

revoke all on function public._survivor_open_week_number(uuid) from public;
revoke all on function public._survivor_open_week_number(uuid) from authenticated;

-- Misma firma que antes (el frontend no cambia): con sesion devuelve la semana
-- abierta del usuario; sin sesion (jobs), la global de siempre.
create or replace function public.survivor_current_week_number()
returns int
language sql
security definer
set search_path = public
stable
as $$
  select case
    when auth.uid() is not null then public._survivor_open_week_number(auth.uid())
    else (
      select min(w.number)
      from public.weeks w
      where w.type = 'regular'
        and (
          not exists (select 1 from public.games g where g.week_id = w.id)
          or exists (select 1 from public.games g where g.week_id = w.id and g.outcome is null)
        )
    )
  end;
$$;

comment on function public.survivor_current_week_number() is
  'Numero de la semana regular que el usuario en sesion puede pickear: la primera cuyo partido (o cierre, si no eligio) todavia no esta resuelto para el.';

-- can_pick_survivor_team (ver 20260918000000): se agrega el tope por semana
-- abierta del usuario — antes el backend no impedia pickear semanas futuras.
create or replace function public.can_pick_survivor_team(p_group_id uuid, p_uid uuid, p_week_id uuid, p_team_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    (
      not exists (
        select 1 from public.survivor_state ss
        where ss.group_id = p_group_id and ss.user_id = p_uid and ss.status = 'eliminated'
      )
      or exists (
        select 1 from public.survivor_state ss
        where ss.group_id = p_group_id and ss.user_id = p_uid
          and ss.status = 'eliminated' and ss.revival_deadline_week_id = p_week_id
      )
    )
    and not exists (
      select 1 from public.survivor_withdrawals sw
      where sw.group_id = p_group_id and sw.user_id = p_uid and sw.withdrawn
    )
    and exists (
      select 1
      from public.games g
      join public.weeks w on w.id = g.week_id
      where g.week_id = p_week_id
        and (g.home_team_id = p_team_id or g.away_team_id = p_team_id)
        and w.type = 'regular'
        and w.number <= coalesce(public._survivor_open_week_number(p_uid), w.number)
    )
    and (
      not public.week_kickoff_started(p_week_id)
      or exists (
        select 1 from public.survivor_pick_exceptions ex
        where ex.group_id = p_group_id and ex.user_id = p_uid and ex.week_id = p_week_id
      )
    );
$$;
