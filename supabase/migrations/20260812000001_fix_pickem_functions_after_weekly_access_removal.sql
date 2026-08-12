-- Fix de 20260812000000: esa migracion borro public.weekly_access pero paso
-- por alto que varias funciones (tablas de posiciones, resumen de perfil,
-- evaluacion de logros) todavia la usaban como fuente de "quien juega esta
-- semana/temporada". Sin esa tabla, la nueva fuente de verdad de
-- participacion es directamente public.weekly_picks (group_id, user_id,
-- game_id, pick): un usuario "participa" en una semana/temporada si tiene al
-- menos un pick registrado ahi, en vez de tener un estado "aprobado" previo.

-- can_view_pickem_tables: "tuvo acceso semanal aprobado alguna vez" pasa a
-- ser "hizo al menos un pick alguna vez" en el grupo.
create or replace function public.can_view_pickem_tables(p_group_id uuid, p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_platform_admin(p_uid)
    or exists (
      select 1 from public.weekly_picks wp
      where wp.group_id = p_group_id and wp.user_id = p_uid
    )
    or coalesce(
      (select ps.tables_visible_to_all from public.pickem_settings ps where ps.group_id = p_group_id),
      false
    );
$$;

comment on function public.can_view_pickem_tables(uuid, uuid) is
  'True si p_uid puede ver las tablas de posiciones del pickem semanal del grupo: es admin, hizo al menos un pick alguna vez, o el admin habilito la visibilidad para todos (pickem_settings).';

create or replace function public.pickem_weekly_standings(p_group_id uuid, p_week_id uuid)
returns table (user_id uuid, display_name text, correct_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name, count(*) filter (where wp.pick = g.outcome) as correct_count
  from public.weekly_picks wp
  join public.games g on g.id = wp.game_id
  join public.profiles p on p.id = wp.user_id
  where wp.group_id = p_group_id
    and g.week_id = p_week_id
    and not public.is_platform_admin(p.id)
    and (not p.is_test_account or public.is_platform_admin(auth.uid()))
    and public.can_view_pickem_tables(p_group_id, auth.uid())
  group by p.id, p.display_name
  order by correct_count desc;
$$;

comment on function public.pickem_weekly_standings(uuid, uuid) is
  'Tabla de posiciones de una semana: aciertos por usuario entre quienes registraron al menos un pick esa semana. Vacia si el llamante no puede ver las tablas (can_view_pickem_tables).';

create or replace function public.pickem_season_standings(p_group_id uuid)
returns table (user_id uuid, display_name text, total_correct bigint)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name, count(*) filter (where wp.pick = g.outcome) as total_correct
  from public.weekly_picks wp
  join public.games g on g.id = wp.game_id
  join public.profiles p on p.id = wp.user_id
  where wp.group_id = p_group_id
    and not public.is_platform_admin(p.id)
    and (not p.is_test_account or public.is_platform_admin(auth.uid()))
    and public.can_view_pickem_tables(p_group_id, auth.uid())
  group by p.id, p.display_name
  order by total_correct desc;
$$;

comment on function public.pickem_season_standings(uuid) is
  'Tabla acumulada de temporada: aciertos totales por usuario, sumando todos los picks que registro. Vacia si el llamante no puede ver las tablas.';

create or replace function public.profile_pickem_summary(p_user_id uuid)
returns table (total_correct bigint, total_picked bigint, total_picks_made bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if p_user_id <> auth.uid() and not public.is_platform_admin(auth.uid()) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    count(*) filter (where wp.pick = g.outcome) as total_correct,
    count(*) filter (where g.outcome is not null) as total_picked,
    count(*) as total_picks_made
  from public.weekly_picks wp
  join public.games g on g.id = wp.game_id
  where wp.user_id = p_user_id;
end;
$$;

create or replace function public.profile_pickem_weekly_trend(p_user_id uuid)
returns table (
  week_sort_order int,
  week_type text,
  week_number int,
  total_correct bigint,
  total_picked bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if p_user_id <> auth.uid() and not public.is_platform_admin(auth.uid()) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    w.sort_order as week_sort_order,
    w.type as week_type,
    w.number as week_number,
    count(*) filter (where wp.pick = g.outcome) as total_correct,
    count(*) filter (where g.outcome is not null) as total_picked
  from public.weekly_picks wp
  join public.games g on g.id = wp.game_id
  join public.weeks w on w.id = g.week_id
  where wp.user_id = p_user_id
  group by w.sort_order, w.type, w.number
  having count(*) filter (where g.outcome is not null) > 0
  order by w.sort_order desc
  limit 6;
end;
$$;

-- _evaluate_pickem_achievements_for_group: los tres logros dependian de
-- iterar "quien tiene weekly_access aprobado" para una semana/grupo. Ahora
-- el universo de participantes de una semana se arma directo desde
-- weekly_picks (distinct user_id que registro al menos un pick ahi).
create or replace function public._evaluate_pickem_achievements_for_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- pickem_semana_perfecta: semanas de este grupo ya resueltas (>=3 partidos,
  -- todos con outcome) donde el usuario acerto el 100% de sus picks.
  with resolved_weeks as (
    select g.week_id
    from public.games g
    group by g.week_id
    having count(*) >= 3 and not bool_or(g.outcome is null)
  ),
  participants as (
    select distinct wp.user_id, g.week_id
    from public.weekly_picks wp
    join public.games g on g.id = wp.game_id
    where wp.group_id = p_group_id
  ),
  perfect as (
    select pt.user_id
    from participants pt
    join resolved_weeks rw on rw.week_id = pt.week_id
    join public.games g on g.week_id = pt.week_id
    left join public.weekly_picks wp on wp.game_id = g.id and wp.user_id = pt.user_id and wp.group_id = p_group_id
    group by pt.user_id, pt.week_id
    having count(*) filter (where wp.pick = g.outcome) = count(*)
  )
  insert into public.user_achievements (user_id, achievement_id, group_id)
  select distinct user_id, 'pickem_semana_perfecta', p_group_id from perfect
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;

  -- pickem_lider_semana: primer puesto (o empatado) en semanas ya resueltas
  -- con al menos un partido.
  with resolved_weeks as (
    select g.week_id
    from public.games g
    group by g.week_id
    having not bool_or(g.outcome is null)
  ),
  participants as (
    select distinct wp.user_id, g.week_id
    from public.weekly_picks wp
    join public.games g on g.id = wp.game_id
    where wp.group_id = p_group_id
  ),
  week_scores as (
    select pt.week_id, pt.user_id,
      count(*) filter (where wp.pick = g.outcome) as correct_count
    from participants pt
    join resolved_weeks rw on rw.week_id = pt.week_id
    join public.games g on g.week_id = pt.week_id
    left join public.weekly_picks wp on wp.game_id = g.id and wp.user_id = pt.user_id and wp.group_id = p_group_id
    group by pt.week_id, pt.user_id
  ),
  leaders as (
    select week_id, user_id
    from (
      select week_id, user_id, correct_count,
        rank() over (partition by week_id order by correct_count desc) as pos
      from week_scores
    ) ranked
    where pos = 1 and correct_count > 0
  )
  insert into public.user_achievements (user_id, achievement_id, group_id)
  select distinct user_id, 'pickem_lider_semana', p_group_id from leaders
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;

  -- pickem_racha_5: 5 aciertos consecutivos (por kickoff_at) entre los picks
  -- con resultado ya definido de este grupo. Tecnica "gaps and islands":
  -- (numero de fila global) - (numero de fila dentro de user_id+hit) es
  -- constante durante una racha continua de aciertos/fallos.
  with ordered as (
    select wp.user_id, g.kickoff_at, (wp.pick = g.outcome) as hit
    from public.weekly_picks wp
    join public.games g on g.id = wp.game_id
    where wp.group_id = p_group_id and g.outcome is not null
  ),
  numbered as (
    select user_id, hit,
      row_number() over (partition by user_id order by kickoff_at) as rn,
      row_number() over (partition by user_id, hit order by kickoff_at) as grp_rn
    from ordered
  ),
  streaks as (
    select user_id, hit, count(*) as streak_len
    from numbered
    group by user_id, hit, (rn - grp_rn)
  )
  insert into public.user_achievements (user_id, achievement_id, group_id)
  select distinct user_id, 'pickem_racha_5', p_group_id
  from streaks
  where hit and streak_len >= 5
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;
end;
$$;

comment on function public._evaluate_pickem_achievements_for_group(uuid) is
  'Logica interna de desbloqueo de logros de Pickem Semanal, sin chequeo de permisos — invocar solo desde el trigger de resultados o desde recalculate_achievements.';

-- _evaluate_survivor_achievements_for_group: solo cambia doble_jugador
-- ("acceso aprobado a Pickem Semanal" -> "al menos un pick de Pickem
-- Semanal registrado"), el resto queda igual.
create or replace function public._evaluate_survivor_achievements_for_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_regular_weeks_total int;
  v_regular_weeks_resolved int;
begin
  select count(*) into v_regular_weeks_total from public.weeks where type = 'regular';
  select count(*) into v_regular_weeks_resolved
    from public.weeks w
    where w.type = 'regular'
      and exists (select 1 from public.games g where g.week_id = w.id)
      and not exists (select 1 from public.games g where g.week_id = w.id and g.outcome is null);

  -- survivor_temporada_regular: sigue "alive" y ya no quedan semanas
  -- regulares del catalogo por resolver.
  if v_regular_weeks_resolved >= v_regular_weeks_total then
    insert into public.user_achievements (user_id, achievement_id, group_id)
    select ss.user_id, 'survivor_temporada_regular', p_group_id
    from public.survivor_state ss
    where ss.group_id = p_group_id and ss.status = 'alive'
    on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
    do nothing;
  end if;

  -- survivor_podio: final_rank ya asignado (1, 2 o 3).
  insert into public.user_achievements (user_id, achievement_id, group_id)
  select ss.user_id, 'survivor_podio', p_group_id
  from public.survivor_state ss
  where ss.group_id = p_group_id and ss.final_rank is not null
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;

  -- survivor_vida_intacta: nunca uso vida extra (current_life = 1) y ya llego
  -- a un estado de cierre (eliminado, o vivo al terminar la temporada
  -- regular). No se otorga mientras el usuario sigue jugando con vida 1.
  insert into public.user_achievements (user_id, achievement_id, group_id)
  select ss.user_id, 'survivor_vida_intacta', p_group_id
  from public.survivor_state ss
  where ss.group_id = p_group_id
    and ss.current_life = 1
    and (
      ss.status = 'eliminated'
      or (ss.status = 'alive' and v_regular_weeks_resolved >= v_regular_weeks_total)
    )
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;

  -- doble_jugador: al menos un pick de Pickem Semanal y al menos un pick de
  -- Survivor, ambos dentro de este mismo grupo.
  insert into public.user_achievements (user_id, achievement_id, group_id)
  select distinct wp.user_id, 'doble_jugador', p_group_id
  from public.weekly_picks wp
  where wp.group_id = p_group_id
    and exists (
      select 1 from public.survivor_picks sp
      where sp.group_id = p_group_id and sp.user_id = wp.user_id
    )
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;
end;
$$;

revoke all on function public._evaluate_survivor_achievements_for_group(uuid) from public;
revoke all on function public._evaluate_survivor_achievements_for_group(uuid) from authenticated;

comment on function public._evaluate_survivor_achievements_for_group(uuid) is
  'Logica interna de desbloqueo de logros de Survivor y doble_jugador, sin chequeo de permisos — invocar solo desde _survivor_recompute o desde recalculate_achievements.';
