-- Bug: la columna "Vida" del panel admin salia siempre en 1 aunque el jugador
-- ya hubiera revivido. survivor_picks.life_number se estampa en un trigger
-- BEFORE INSERT con el current_life de ese momento, pero el pick que revive al
-- jugador sube la vida DESPUES (en el recompute). Ahora _survivor_recompute
-- reescribe life_number de cada semana evaluada con la vida real de ese momento.
create or replace function public._survivor_recompute(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_id uuid;
  v_next_week_id uuid;
  v_has_games boolean;
  v_week_resolved boolean;
  v_kickoff_started boolean;
  v_user_id uuid;
  v_pick_team text;
  v_game_outcome text;
  v_game_home text;
  v_game_away text;
  v_team_won boolean;
  v_current_life int;
  v_regular_weeks_total int;
  v_regular_weeks_resolved int := 0;
  v_prior_weeks_resolved boolean := true;
  v_game_pending boolean;
  v_alive_count int;
begin
  create temporary table if not exists tmp_survivor_state (
    user_id uuid primary key,
    current_life int not null default 1,
    status text not null default 'alive',
    first_loss_week_id uuid,
    eliminated_week_id uuid,
    revival_deadline_week_id uuid,
    final_rank int,
    blocked boolean not null default false
  ) on commit drop;
  truncate tmp_survivor_state;

  insert into tmp_survivor_state (user_id)
  select gm.user_id from public.group_members gm
  where gm.group_id = p_group_id
    and not exists (
      select 1 from public.survivor_withdrawals sw
      where sw.group_id = p_group_id and sw.user_id = gm.user_id and sw.withdrawn
    );

  select count(*) into v_regular_weeks_total from public.weeks where type = 'regular';

  for v_week_id in select w.id from public.weeks w where w.type = 'regular' order by w.sort_order
  loop
    select exists(select 1 from public.games g where g.week_id = v_week_id) into v_has_games;
    exit when not v_has_games;

    select public.week_kickoff_started(v_week_id) into v_kickoff_started;

    -- Paso 1: resolver a quienes esta semana es SU ventana de revivir (perdieron
    -- la semana pasada con vidas disponibles). No depende de que esta semana ya
    -- se haya jugado, solo de si ya eligieron equipo o si ya arranco el primer
    -- partido (deadline). Corre antes que el resto para que, si revive, su pick
    -- de esta semana se evalue igual que cualquier otro vivo mas abajo.
    for v_user_id in
      select t.user_id from tmp_survivor_state t where t.revival_deadline_week_id = v_week_id
    loop
      select sp.team_id into v_pick_team
        from public.survivor_picks sp
        where sp.group_id = p_group_id and sp.user_id = v_user_id and sp.week_id = v_week_id;

      if v_pick_team is not null then
        update tmp_survivor_state set
          status = 'alive',
          current_life = current_life + 1,
          eliminated_week_id = null,
          revival_deadline_week_id = null
        where user_id = v_user_id;
      elsif v_kickoff_started then
        update tmp_survivor_state set revival_deadline_week_id = null
        where user_id = v_user_id;

        insert into public.survivor_notifications (group_id, user_id, week_id, type, reason)
        values (p_group_id, v_user_id, v_week_id, 'eliminated', 'missed_revival_window')
        on conflict do nothing;
      end if;
      -- si no eligio y todavia no arranca el primer partido de esta semana, se
      -- deja igual (sigue "eliminado" a la vista, ventana todavia abierta) hasta
      -- la proxima corrida.
    end loop;

    select not exists(select 1 from public.games g where g.week_id = v_week_id and g.outcome is null)
      into v_week_resolved;

    -- Cada usuario se evalua en cuanto se define SU partido (no hay que esperar
    -- a que termine toda la semana). Si el suyo sigue pendiente queda
    -- "blocked" y no se le evalua ninguna semana posterior.
    if v_week_resolved and v_prior_weeks_resolved then
      v_regular_weeks_resolved := v_regular_weeks_resolved + 1;
    else
      v_prior_weeks_resolved := false;
    end if;

    select w2.id into v_next_week_id
      from public.weeks w2
      where w2.type = 'regular'
        and w2.sort_order > (select sort_order from public.weeks where id = v_week_id)
      order by w2.sort_order
      limit 1;

    for v_user_id in select t.user_id from tmp_survivor_state t where t.status = 'alive' and not t.blocked
    loop
      select sp.team_id into v_pick_team
        from public.survivor_picks sp
        where sp.group_id = p_group_id and sp.user_id = v_user_id and sp.week_id = v_week_id;

      v_game_pending := false;

      -- La vida con la que se jugo esta semana: el trigger de insert la estampa
      -- ANTES de que el pick reviva al usuario, asi que se corrige aqui.
      update public.survivor_picks sp
        set life_number = (select t.current_life from tmp_survivor_state t where t.user_id = v_user_id)
        where sp.group_id = p_group_id and sp.user_id = v_user_id and sp.week_id = v_week_id;
      if v_pick_team is null then
        -- Sin pick: pierde cuando arranca la semana (ya no puede elegir);
        -- antes de eso sigue pendiente.
        if v_kickoff_started then
          v_team_won := false;
        else
          v_game_pending := true;
        end if;
      else
        select g.outcome, g.home_team_id, g.away_team_id
          into v_game_outcome, v_game_home, v_game_away
          from public.games g
          where g.week_id = v_week_id and (g.home_team_id = v_pick_team or g.away_team_id = v_pick_team);

        if v_game_outcome is null then
          v_game_pending := true;
        else
          v_team_won := (v_game_outcome = 'home' and v_game_home = v_pick_team)
                      or (v_game_outcome = 'away' and v_game_away = v_pick_team);
        end if;
      end if;

      if v_game_pending then
        update tmp_survivor_state set blocked = true where user_id = v_user_id;
        continue;
      end if;

      if v_team_won then
        insert into public.survivor_notifications (group_id, user_id, week_id, type, reason)
        values (p_group_id, v_user_id, v_week_id, 'alive', 'won')
        on conflict do nothing;
      else
        select t.current_life into v_current_life from tmp_survivor_state t where t.user_id = v_user_id;

        update tmp_survivor_state set
          first_loss_week_id = coalesce(first_loss_week_id, v_week_id),
          status = 'eliminated',
          eliminated_week_id = v_week_id
        where user_id = v_user_id;

        if v_current_life >= 3 or v_next_week_id is null then
          insert into public.survivor_notifications (group_id, user_id, week_id, type, reason)
          values (p_group_id, v_user_id, v_week_id, 'eliminated', 'lost_no_lives')
          on conflict do nothing;
        else
          update tmp_survivor_state set revival_deadline_week_id = v_next_week_id
          where user_id = v_user_id;

          insert into public.survivor_notifications (group_id, user_id, week_id, type, reason)
          values (p_group_id, v_user_id, v_week_id, 'eliminated', 'lost_can_revive')
          on conflict do nothing;
        end if;
      end if;
    end loop;
  end loop;

  -- "Vivo" para este corte incluye a quienes todavia tienen la ventana de
  -- revivir abierta (revival_deadline_week_id seteado) — no estan afuera en
  -- definitiva, podrian volver a 'alive' si eligen equipo a tiempo.
  select count(*) into v_alive_count
  from tmp_survivor_state where status = 'alive' or revival_deadline_week_id is not null;

  -- Podio (tareas 3.5/3.6): solo una vez que el pool "termino" — queda 1 o 0
  -- vivos (contando ventanas de revivir abiertas), o ya se resolvieron todas
  -- las semanas regulares del catalogo.
  if v_alive_count <= 1 or v_regular_weeks_resolved >= v_regular_weeks_total then
    with augmented as (
      select
        t.user_id,
        case when t.status = 'alive' or t.revival_deadline_week_id is not null then 999 else coalesce(we.sort_order, -1) end as elim_order,
        case when t.status = 'alive' or t.revival_deadline_week_id is not null then 999 else coalesce(wf.sort_order, -1) end as first_loss_order
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
    (group_id, user_id, current_life, status, first_loss_week_id, eliminated_week_id, revival_deadline_week_id, final_rank)
  select p_group_id, user_id, current_life, status, first_loss_week_id, eliminated_week_id, revival_deadline_week_id, final_rank
  from tmp_survivor_state;
end;
$$;

revoke all on function public._survivor_recompute(uuid) from public;
revoke all on function public._survivor_recompute(uuid) from authenticated;

-- Reparar picks existentes.
do $$
declare g record;
begin
  for g in select id from public.groups loop
    perform public._survivor_recompute(g.id);
  end loop;
end $$;
