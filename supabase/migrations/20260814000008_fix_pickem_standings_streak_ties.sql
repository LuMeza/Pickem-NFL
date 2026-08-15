-- Bug: pickem_weekly_standings/pickem_season_standings (20260814000003)
-- devolvian filas duplicadas del mismo usuario cuando dos o mas partidos
-- arrancan exactamente a la misma hora (comun en pretemporada, ej. varios
-- juegos del mismo horario). La tecnica de gaps-and-islands para la racha
-- actual ordenaba por kickoff_at sin desempate, y despues reconectaba la
-- racha del usuario buscando la isla cuyo max(kickoff_at) coincidiera con el
-- ultimo pick -- con horarios empatados esa busqueda podia matchear mas de
-- una isla, y el join de vuelta a `base` multiplicaba la fila del usuario
-- (mismo user_id, correct_count igual, current_streak distinto entre copias).
--
-- Fix: se agrega game_id como desempate estable en el order by, y la
-- reconexion isla <-> ultimo pick se hace por row_number (rn, unico por
-- usuario) en vez de por kickoff_at (que puede repetirse). No cambia
-- correct_count/total_correct ni ningun pick -- solo hace determinista y
-- 1:1 el calculo de current_streak.
create or replace function public.pickem_weekly_standings(p_group_id uuid, p_week_id uuid)
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
    select wp.user_id, g.id as game_id, g.kickoff_at, (wp.pick = g.outcome) as hit
    from public.weekly_picks wp
    join public.games g on g.id = wp.game_id
    where wp.group_id = p_group_id and g.week_id = p_week_id and g.outcome is not null
  ),
  numbered as (
    select user_id, hit,
      row_number() over (partition by user_id order by kickoff_at, game_id) as rn,
      row_number() over (partition by user_id, hit order by kickoff_at, game_id) as grp_rn
    from ordered
  ),
  islands as (
    select user_id, hit, count(*) as len, max(rn) as last_rn
    from numbered
    group by user_id, hit, (rn - grp_rn)
  ),
  last_pick as (
    select user_id, max(rn) as last_rn from numbered group by user_id
  ),
  streaks as (
    select lp.user_id, coalesce(i.len, 0) as current_streak
    from last_pick lp
    left join islands i on i.user_id = lp.user_id and i.last_rn = lp.last_rn and i.hit
  )
  select b.user_id, b.display_name, b.correct_count, coalesce(s.current_streak, 0) as current_streak
  from base b
  left join streaks s on s.user_id = b.user_id
  order by b.correct_count desc;
$$;

comment on function public.pickem_weekly_standings(uuid, uuid) is
  'Tabla de posiciones de una semana: aciertos por usuario y racha actual de aciertos consecutivos (termina en 0 si el pick con resultado mas reciente fue un fallo). Desempate estable por game_id para partidos con el mismo kickoff_at. Vacia si el llamante no puede ver las tablas (can_view_pickem_tables).';

create or replace function public.pickem_season_standings(p_group_id uuid)
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
    select wp.user_id, g.id as game_id, g.kickoff_at, (wp.pick = g.outcome) as hit
    from public.weekly_picks wp
    join public.games g on g.id = wp.game_id
    where wp.group_id = p_group_id and g.outcome is not null
  ),
  numbered as (
    select user_id, hit,
      row_number() over (partition by user_id order by kickoff_at, game_id) as rn,
      row_number() over (partition by user_id, hit order by kickoff_at, game_id) as grp_rn
    from ordered
  ),
  islands as (
    select user_id, hit, count(*) as len, max(rn) as last_rn
    from numbered
    group by user_id, hit, (rn - grp_rn)
  ),
  last_pick as (
    select user_id, max(rn) as last_rn from numbered group by user_id
  ),
  streaks as (
    select lp.user_id, coalesce(i.len, 0) as current_streak
    from last_pick lp
    left join islands i on i.user_id = lp.user_id and i.last_rn = lp.last_rn and i.hit
  )
  select b.user_id, b.display_name, b.total_correct, coalesce(s.current_streak, 0) as current_streak
  from base b
  left join streaks s on s.user_id = b.user_id
  order by b.total_correct desc;
$$;

comment on function public.pickem_season_standings(uuid) is
  'Tabla acumulada de temporada: aciertos totales por usuario y racha actual de aciertos consecutivos (cruza semanas, termina en 0 si el pick con resultado mas reciente fue un fallo). Desempate estable por game_id para partidos con el mismo kickoff_at. Vacia si el llamante no puede ver las tablas.';
