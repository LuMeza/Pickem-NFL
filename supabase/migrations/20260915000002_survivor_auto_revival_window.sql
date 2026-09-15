-- Feedback de producto: se revierte el gate de aprobacion admin de vidas
-- extra (design.md decision 7) — sumaba friccion/estado (needs_life_request/
-- life_request_pending) sin aportar control real, porque el control de pago
-- real ya lo cubre survivor_withdrawals (20260915000001): si alguien no paga
-- la vida extra, el admin lo retira del pool y su pick deja de contar, en vez
-- de bloquearlo antes de pickear.
--
-- Nueva regla (reemplaza el auto-otorgamiento sin condiciones de la version
-- original pre-decision-7): al perder con vidas disponibles, el usuario
-- queda "eliminado" de inmediato (se ve como muerto en la tabla). Tiene UNA
-- sola ventana para revivir: si elige un equipo en la semana INMEDIATA
-- siguiente (antes de que arranque su primer partido), se le devuelve el
-- estado "alive" consumiendo una vida extra — el pick en si es la señal de
-- "quiero seguir", sin aprobacion de nadie. Si no elige a tiempo, queda
-- eliminado en definitiva (aunque le quedaran vidas sin usar). Ya usadas las
-- 2 vidas extra, la siguiente derrota es eliminacion definitiva sin ventana.
update public.survivor_state set status = 'eliminated'
where status in ('needs_life_request', 'life_request_pending');

alter table public.survivor_state drop constraint survivor_state_status_check;
alter table public.survivor_state add constraint survivor_state_status_check
  check (status in ('alive', 'eliminated'));

-- Semana en la que, si elige equipo, revive (unica ventana). Null cuando
-- esta vivo o cuando ya quedo eliminado en definitiva (sin ventana abierta).
alter table public.survivor_state add column if not exists revival_deadline_week_id uuid references public.weeks (id);

drop table if exists public.survivor_life_requests cascade;
drop function if exists public._survivor_recompute_on_life_request_trigger();
drop function if exists public.can_request_survivor_life(uuid, uuid, int);

alter table public.survivor_notifications drop constraint survivor_notifications_reason_check;
alter table public.survivor_notifications add constraint survivor_notifications_reason_check
  check (reason in ('won', 'lost_can_revive', 'lost_no_lives', 'missed_revival_window'));

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
  v_alive_count int;
begin
  create temporary table if not exists tmp_survivor_state (
    user_id uuid primary key,
    current_life int not null default 1,
    status text not null default 'alive',
    first_loss_week_id uuid,
    eliminated_week_id uuid,
    revival_deadline_week_id uuid,
    final_rank int
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
    exit when not v_week_resolved;

    v_regular_weeks_resolved := v_regular_weeks_resolved + 1;

    select w2.id into v_next_week_id
      from public.weeks w2
      where w2.type = 'regular'
        and w2.sort_order > (select sort_order from public.weeks where id = v_week_id)
      order by w2.sort_order
      limit 1;

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

comment on function public._survivor_recompute(uuid) is
  'Logica interna de recalculo de Survivor, sin chequeo de permisos — invocar solo desde el trigger de resultados, el de survivor_picks, o desde recalculate_survivor_state. Al perder con vidas disponibles el usuario queda "eliminado" con una ventana de una semana (revival_deadline_week_id) para revivir si elige equipo a tiempo.';

-- Recalcular cuando alguien registra/cambia su pick — necesario ahora porque
-- el pick en si puede revivirlo (antes un pick nunca cambiaba el resultado
-- de supervivencia, solo el resultado del partido lo hacia).
create or replace function public._survivor_recompute_on_pick_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._survivor_recompute(new.group_id);
  return null;
end;
$$;

drop trigger if exists survivor_picks_recompute on public.survivor_picks;
create trigger survivor_picks_recompute
  after insert or update of team_id on public.survivor_picks
  for each row
  execute function public._survivor_recompute_on_pick_trigger();

-- can_pick_survivor_team (ver 20260915000001 para la version previa): ademas
-- de lo que ya validaba, permite pickear a quien esta "eliminado" pero
-- todavia tiene la ventana de revivir abierta para justo esa semana.
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
    )
    and not public.week_kickoff_started(p_week_id);
$$;

comment on function public.can_pick_survivor_team(uuid, uuid, uuid, text) is
  'True si p_uid puede elegir p_team_id en p_week_id para Survivor: no esta eliminado (o esta en su ventana de revivir justo para esta semana), no fue retirado por el admin, la semana es regular, el equipo tiene partido esa semana y todavia no inicio el primer partido.';

-- survivor_group_roster (ver 20260915000001 para la version previa): expone
-- revival_deadline_week_id para que el frontend sepa cuando mostrar el
-- selector de equipo aunque el usuario ya este "eliminado".
drop function if exists public.survivor_group_roster(uuid);

create function public.survivor_group_roster(p_group_id uuid)
returns table (
  user_id uuid,
  display_name text,
  current_life int,
  status text,
  first_loss_week_id uuid,
  eliminated_week_id uuid,
  revival_deadline_week_id uuid,
  final_rank int
)
language sql
security definer
set search_path = public
stable
as $$
  select
    gm.user_id,
    p.display_name,
    coalesce(ss.current_life, 1) as current_life,
    coalesce(ss.status, 'alive') as status,
    ss.first_loss_week_id,
    ss.eliminated_week_id,
    ss.revival_deadline_week_id,
    ss.final_rank
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  left join public.survivor_state ss on ss.group_id = gm.group_id and ss.user_id = gm.user_id
  where gm.group_id = p_group_id
    and (public.is_group_member(p_group_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    and not public.is_platform_admin(gm.user_id)
    and (not p.is_test_account or public.is_platform_admin(auth.uid()))
    and not exists (
      select 1 from public.survivor_withdrawals sw
      where sw.group_id = p_group_id and sw.user_id = gm.user_id and sw.withdrawn
    );
$$;
