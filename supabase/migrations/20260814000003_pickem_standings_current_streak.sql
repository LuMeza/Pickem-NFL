-- Feedback de producto: agregar una "rachita" a la tabla de posiciones —
-- a partir de 3 aciertos seguidos se le pone un fuego al lado del nombre,
-- que se pierde en cuanto fallan un pick. Es la racha ACTUAL (la que
-- termina en el pick con resultado mas reciente), no la mejor racha
-- historica — para eso ya existe el logro pickem_racha_5.
--
-- Misma tecnica "gaps and islands" que _evaluate_pickem_achievements_for_group
-- usa para pickem_racha_5 (20260812000001), pero en vez de buscar CUALQUIER
-- racha de aciertos >= 5 en toda la temporada, se queda solo con la isla que
-- contiene el pick mas reciente (por kickoff_at) y la descarta si esa isla
-- es de fallos (current_streak = 0).
-- create or replace no alcanza: cambia la forma de las columnas de salida
-- (se agrega current_streak), y Postgres no permite eso sin dropear antes.
drop function if exists public.pickem_weekly_standings(uuid, uuid);

create function public.pickem_weekly_standings(p_group_id uuid, p_week_id uuid)
returns table (user_id uuid, display_name text, correct_count bigint, current_streak bigint)
language sql
security definer
set search_path = public
stable
as $$
  with base as (
    select p.id as user_id, p.display_name,
      count(*) filter (where wp.pick = g.outcome) as correct_count
    from public.weekly_picks wp
    join public.games g on g.id = wp.game_id
    join public.profiles p on p.id = wp.user_id
    where wp.group_id = p_group_id
      and g.week_id = p_week_id
      and not public.is_platform_admin(p.id)
      and (not p.is_test_account or public.is_platform_admin(auth.uid()))
      and public.can_view_pickem_tables(p_group_id, auth.uid())
    group by p.id, p.display_name
  ),
  ordered as (
    select wp.user_id, g.kickoff_at, (wp.pick = g.outcome) as hit
    from public.weekly_picks wp
    join public.games g on g.id = wp.game_id
    where wp.group_id = p_group_id and g.week_id = p_week_id and g.outcome is not null
  ),
  numbered as (
    select user_id, hit, kickoff_at,
      row_number() over (partition by user_id order by kickoff_at) as rn,
      row_number() over (partition by user_id, hit order by kickoff_at) as grp_rn
    from ordered
  ),
  islands as (
    select user_id, hit, count(*) as len, max(kickoff_at) as last_kickoff
    from numbered
    group by user_id, hit, (rn - grp_rn)
  ),
  last_pick as (
    select user_id, max(kickoff_at) as last_kickoff from ordered group by user_id
  ),
  streaks as (
    select lp.user_id, coalesce(i.len, 0) as current_streak
    from last_pick lp
    left join islands i on i.user_id = lp.user_id and i.last_kickoff = lp.last_kickoff and i.hit
  )
  select b.user_id, b.display_name, b.correct_count, coalesce(s.current_streak, 0) as current_streak
  from base b
  left join streaks s on s.user_id = b.user_id
  order by b.correct_count desc;
$$;

comment on function public.pickem_weekly_standings(uuid, uuid) is
  'Tabla de posiciones de una semana: aciertos por usuario y racha actual de aciertos consecutivos (termina en 0 si el pick con resultado mas reciente fue un fallo). Vacia si el llamante no puede ver las tablas (can_view_pickem_tables).';

drop function if exists public.pickem_season_standings(uuid);

create function public.pickem_season_standings(p_group_id uuid)
returns table (user_id uuid, display_name text, total_correct bigint, current_streak bigint)
language sql
security definer
set search_path = public
stable
as $$
  with base as (
    select p.id as user_id, p.display_name,
      count(*) filter (where wp.pick = g.outcome) as total_correct
    from public.weekly_picks wp
    join public.games g on g.id = wp.game_id
    join public.profiles p on p.id = wp.user_id
    where wp.group_id = p_group_id
      and not public.is_platform_admin(p.id)
      and (not p.is_test_account or public.is_platform_admin(auth.uid()))
      and public.can_view_pickem_tables(p_group_id, auth.uid())
    group by p.id, p.display_name
  ),
  ordered as (
    select wp.user_id, g.kickoff_at, (wp.pick = g.outcome) as hit
    from public.weekly_picks wp
    join public.games g on g.id = wp.game_id
    where wp.group_id = p_group_id and g.outcome is not null
  ),
  numbered as (
    select user_id, hit, kickoff_at,
      row_number() over (partition by user_id order by kickoff_at) as rn,
      row_number() over (partition by user_id, hit order by kickoff_at) as grp_rn
    from ordered
  ),
  islands as (
    select user_id, hit, count(*) as len, max(kickoff_at) as last_kickoff
    from numbered
    group by user_id, hit, (rn - grp_rn)
  ),
  last_pick as (
    select user_id, max(kickoff_at) as last_kickoff from ordered group by user_id
  ),
  streaks as (
    select lp.user_id, coalesce(i.len, 0) as current_streak
    from last_pick lp
    left join islands i on i.user_id = lp.user_id and i.last_kickoff = lp.last_kickoff and i.hit
  )
  select b.user_id, b.display_name, b.total_correct, coalesce(s.current_streak, 0) as current_streak
  from base b
  left join streaks s on s.user_id = b.user_id
  order by b.total_correct desc;
$$;

comment on function public.pickem_season_standings(uuid) is
  'Tabla acumulada de temporada: aciertos totales por usuario y racha actual de aciertos consecutivos (cruza semanas, termina en 0 si el pick con resultado mas reciente fue un fallo). Vacia si el llamante no puede ver las tablas.';
