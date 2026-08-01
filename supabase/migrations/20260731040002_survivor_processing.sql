-- Tareas 3.1-3.3/3.5-3.6 (modulo-survivor): recalculo completo del estado de
-- Survivor de un grupo. Ver design.md decision 4 — se recalcula desde cero
-- cada vez (idempotente) en vez de mutar incrementalmente, para poder
-- re-correrlo sin riesgo tras corregir un resultado ya cargado.
--
-- Recorre las semanas 'regular' en orden cronologico; para cada semana ya
-- resuelta (todos sus partidos con resultado) hace avanzar a cada usuario
-- vivo: gana con su equipo elegido -> sigue igual; pierde/empata/no eligio ->
-- consume una vida (o lo elimina si ya no le quedan). Se detiene en la
-- primera semana todavia sin resolver (partidos pendientes) — no se adelanta
-- a semanas futuras sin saber el resultado de las anteriores.
--
-- _survivor_recompute es la logica real, sin chequeo de permisos: la invoca
-- (a) el trigger de resultados de partidos (automatico, disparado por carga
-- manual o por la sincronizacion ESPN) y (b) recalculate_survivor_state, el
-- wrapper publico para que el administrador lo dispare a mano como plan B.
create or replace function public._survivor_recompute(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_id uuid;
  v_has_games boolean;
  v_week_resolved boolean;
  v_user_id uuid;
  v_pick_team text;
  v_game_outcome text;
  v_game_home text;
  v_game_away text;
  v_team_won boolean;
  v_regular_weeks_total int;
  v_regular_weeks_resolved int := 0;
  v_alive_count int;
begin
  create temporary table if not exists tmp_survivor_state (
    user_id uuid primary key,
    current_life int not null default 1,
    status text not null default 'alive',
    first_loss_week_id uuid,
    eliminated_week_id uuid,
    final_rank int
  ) on commit drop;
  delete from tmp_survivor_state;

  insert into tmp_survivor_state (user_id)
  select gm.user_id from public.group_members gm where gm.group_id = p_group_id;

  select count(*) into v_regular_weeks_total from public.weeks where type = 'regular';

  for v_week_id in select w.id from public.weeks w where w.type = 'regular' order by w.sort_order
  loop
    select exists(select 1 from public.games g where g.week_id = v_week_id) into v_has_games;
    exit when not v_has_games;

    select not exists(select 1 from public.games g where g.week_id = v_week_id and g.outcome is null)
      into v_week_resolved;
    exit when not v_week_resolved;

    v_regular_weeks_resolved := v_regular_weeks_resolved + 1;

    for v_user_id in select t.user_id from tmp_survivor_state t where t.status = 'alive'
    loop
      select sp.team_id into v_pick_team
        from public.survivor_picks sp
        where sp.group_id = p_group_id and sp.user_id = v_user_id and sp.week_id = v_week_id;

      if v_pick_team is null then
        v_team_won := false;
      else
        select g.outcome, g.home_team_id, g.away_team_id
          into v_game_outcome, v_game_home, v_game_away
          from public.games g
          where g.week_id = v_week_id and (g.home_team_id = v_pick_team or g.away_team_id = v_pick_team);

        v_team_won := (v_game_outcome = 'home' and v_game_home = v_pick_team)
                    or (v_game_outcome = 'away' and v_game_away = v_pick_team);
      end if;

      if not v_team_won then
        update tmp_survivor_state t set
          first_loss_week_id = case when t.current_life = 1 then coalesce(t.first_loss_week_id, v_week_id) else t.first_loss_week_id end,
          eliminated_week_id = case when t.current_life >= 3 then v_week_id else t.eliminated_week_id end,
          status = case when t.current_life >= 3 then 'eliminated' else t.status end,
          current_life = case when t.current_life < 3 then t.current_life + 1 else t.current_life end
        where t.user_id = v_user_id;
      end if;
    end loop;
  end loop;

  select count(*) into v_alive_count from tmp_survivor_state where status = 'alive';

  -- Podio (tareas 3.5/3.6): solo una vez que el pool "termino" — queda 1 o 0
  -- vivos, o ya se resolvieron todas las semanas regulares del catalogo.
  -- Antes de eso final_rank queda null para todos (temporada en curso).
  if v_alive_count <= 1 or v_regular_weeks_resolved >= v_regular_weeks_total then
    with augmented as (
      select
        t.user_id,
        case when t.status = 'alive' then 999 else coalesce(we.sort_order, -1) end as elim_order,
        case when t.status = 'alive' then 999 else coalesce(wf.sort_order, -1) end as first_loss_order
      from tmp_survivor_state t
      left join public.weeks we on we.id = t.eliminated_week_id
      left join public.weeks wf on wf.id = t.first_loss_week_id
    ),
    ranked as (
      select user_id, dense_rank() over (order by elim_order desc, first_loss_order desc) as computed_rank
      from augmented
    )
    update tmp_survivor_state t set final_rank = r.computed_rank
    from ranked r
    where t.user_id = r.user_id and r.computed_rank <= 3;
  end if;

  delete from public.survivor_state where group_id = p_group_id;
  insert into public.survivor_state
    (group_id, user_id, current_life, status, first_loss_week_id, eliminated_week_id, final_rank)
  select p_group_id, user_id, current_life, status, first_loss_week_id, eliminated_week_id, final_rank
  from tmp_survivor_state;
end;
$$;

revoke all on function public._survivor_recompute(uuid) from public;
revoke all on function public._survivor_recompute(uuid) from authenticated;

comment on function public._survivor_recompute(uuid) is
  'Logica interna de recalculo de Survivor, sin chequeo de permisos — invocar solo desde el trigger de resultados o desde recalculate_survivor_state.';

-- Tarea 3.1 (plan B manual): wrapper publico, solo platform_admins.
create or replace function public.recalculate_survivor_state(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Solo un administrador puede recalcular el estado de survivor';
  end if;
  perform public._survivor_recompute(p_group_id);
end;
$$;

comment on function public.recalculate_survivor_state(uuid) is
  'Panel admin (plan B): recalcula el estado de Survivor de un grupo a mano, por si la recomputacion automatica (trigger de resultados) no corrio.';

-- Tarea 3.1 (automatico, ver openspec design.md — disparado por resultado,
-- idealmente via la sincronizacion ESPN): recalcula Survivor para todos los
-- grupos cada vez que cambia el resultado oficial de un partido, sin importar
-- si la carga fue manual (admin) o automatica (service role de ESPN sync).
create or replace function public._survivor_recompute_on_result_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  for v_group_id in select id from public.groups loop
    perform public._survivor_recompute(v_group_id);
  end loop;
  return null;
end;
$$;

drop trigger if exists games_survivor_recompute on public.games;
create trigger games_survivor_recompute
  after update of outcome, home_score, away_score on public.games
  for each row
  when (new.outcome is distinct from old.outcome)
  execute function public._survivor_recompute_on_result_trigger();
