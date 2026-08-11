-- Corrige el corte de seleccion de Survivor: cerraba partido por partido
-- (el equipo de un juego tardio seguia elegible aunque otros de la misma
-- semana ya hubieran arrancado), lo que permite elegir con informacion de
-- resultados ya conocidos de esa semana. Ahora cierra toda la semana en el
-- kickoff mas temprano, igual que weekly_access (public.week_kickoff_started).
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
      where ss.group_id = p_group_id and ss.user_id = p_uid and ss.status = 'eliminated'
    )
    and exists (
      select 1
      from public.games g
      join public.weeks w on w.id = g.week_id
      where g.week_id = p_week_id
        and (g.home_team_id = p_team_id or g.away_team_id = p_team_id)
        and w.type = 'regular'
    )
    and not public.week_kickoff_started(p_week_id);
$$;

comment on function public.can_pick_survivor_team(uuid, uuid, uuid, text) is
  'True si p_uid puede elegir p_team_id en p_week_id para Survivor: no esta eliminado, la semana es regular, el equipo tiene partido esa semana y todavia no inicio el primer partido de la semana.';
