-- Bug detectado en produccion (2026-08-13): al cargarse el resultado de un
-- partido via la sincronizacion ESPN, el trigger games_survivor_recompute
-- llama a _survivor_recompute, que arrancaba con "delete from
-- tmp_survivor_state;" (sin WHERE) para vaciar la tabla temporal antes de
-- recalcular. Es la unica sentencia DELETE sin filtro en todo el schema
-- (verificado contra pg_proc) y, invocada dentro de la transaccion del
-- UPDATE de resultado via el camino service-role/PostgREST de la Edge
-- Function, fallaba con "DELETE requires a WHERE clause" — lo que hacia
-- rollback de TODA la transaccion, incluido el UPDATE del resultado. Asi
-- quedaron sin sincronizar CIN@DET y PIT@GB (semana 1 de pretemporada,
-- 2026-08-13) pese a que sync-espn-results los reintentaba cada 15 min.
--
-- Fix: TRUNCATE tiene el mismo efecto (vaciar la tabla) pero no es una
-- sentencia DELETE, asi que no dispara esa restriccion. Se preserva porque
-- _survivor_recompute_on_result_trigger recorre todos los grupos dentro de
-- la MISMA transaccion, y tmp_survivor_state (on commit drop) sigue viva
-- entre esas llamadas — sin vaciarla, el segundo grupo arrancaria con las
-- filas del primero todavia adentro.
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
  v_current_life int;
  v_life_request_status text;
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
  truncate tmp_survivor_state;

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

    -- Solo los vivos "sin decision pendiente" se evaluan cada semana; los que
    -- quedaron en needs_life_request/life_request_pending/eliminated quedan
    -- congelados hasta que se resuelva su solicitud (una recorrida nueva, ya
    -- sea por trigger de resultados o de survivor_life_requests, los vuelve a
    -- evaluar desde cero).
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

      if v_team_won then
        insert into public.survivor_notifications (group_id, user_id, week_id, type, reason)
        values (p_group_id, v_user_id, v_week_id, 'alive', 'won')
        on conflict do nothing;
      else
        select t.current_life into v_current_life from tmp_survivor_state t where t.user_id = v_user_id;

        if v_current_life >= 3 then
          update tmp_survivor_state set status = 'eliminated', eliminated_week_id = v_week_id
          where user_id = v_user_id;

          insert into public.survivor_notifications (group_id, user_id, week_id, type, reason)
          values (p_group_id, v_user_id, v_week_id, 'eliminated', 'lost_no_lives')
          on conflict do nothing;
        else
          if v_current_life = 1 then
            update tmp_survivor_state set first_loss_week_id = coalesce(first_loss_week_id, v_week_id)
            where user_id = v_user_id;
          end if;

          v_life_request_status := null;
          select lr.status into v_life_request_status
            from public.survivor_life_requests lr
            where lr.group_id = p_group_id and lr.user_id = v_user_id and lr.life_number = v_current_life + 1;

          if v_life_request_status = 'aprobado' then
            update tmp_survivor_state set current_life = v_current_life + 1 where user_id = v_user_id;

            insert into public.survivor_notifications (group_id, user_id, week_id, type, reason)
            values (p_group_id, v_user_id, v_week_id, 'alive', 'life_used')
            on conflict do nothing;
          elsif v_life_request_status = 'rechazado' then
            update tmp_survivor_state set status = 'eliminated', eliminated_week_id = v_week_id
            where user_id = v_user_id;

            insert into public.survivor_notifications (group_id, user_id, week_id, type, reason)
            values (p_group_id, v_user_id, v_week_id, 'eliminated', 'life_rejected')
            on conflict do nothing;
          elsif v_life_request_status = 'solicitado' then
            update tmp_survivor_state set status = 'life_request_pending' where user_id = v_user_id;
          else
            update tmp_survivor_state set status = 'needs_life_request' where user_id = v_user_id;
          end if;
        end if;
      end if;
    end loop;
  end loop;

  -- "Vivo" para este corte incluye a quienes todavia esperan resolucion de
  -- una solicitud de vida (needs_life_request/life_request_pending) — no
  -- estan eliminados, podrian volver a 'alive' si se aprueba.
  select count(*) into v_alive_count
  from tmp_survivor_state where status in ('alive', 'needs_life_request', 'life_request_pending');

  -- Podio (tareas 3.5/3.6): solo una vez que el pool "termino" — queda 1 o 0
  -- vivos, o ya se resolvieron todas las semanas regulares del catalogo.
  if v_alive_count <= 1 or v_regular_weeks_resolved >= v_regular_weeks_total then
    with augmented as (
      select
        t.user_id,
        case when t.status in ('alive', 'needs_life_request', 'life_request_pending') then 999 else coalesce(we.sort_order, -1) end as elim_order,
        case when t.status in ('alive', 'needs_life_request', 'life_request_pending') then 999 else coalesce(wf.sort_order, -1) end as first_loss_order
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
  'Logica interna de recalculo de Survivor, sin chequeo de permisos — invocar solo desde el trigger de resultados, el de survivor_life_requests, o desde recalculate_survivor_state. Ademas de recalcular survivor_state, deja un registro en survivor_notifications (outbox) la primera vez que determina el desenlace semanal de cada usuario.';
