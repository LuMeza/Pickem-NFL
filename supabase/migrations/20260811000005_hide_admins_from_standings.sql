-- Amplia 20260811000004_hide_test_accounts_from_standings.sql: los
-- platform_admins tampoco deberian aparecer en las tablas de posiciones
-- (ni Pickem Semanal ni Survivor) -- un admin no juega, solo administra,
-- asi que su fila no tiene sentido ahi. A diferencia del filtro de cuenta
-- de prueba (oculto salvo que quien mira sea admin), esta exclusion es
-- incondicional: ni siquiera otro admin deberia ver la fila de un admin en
-- la tabla de posiciones. Los admins conservan visibilidad completa de los
-- jugadores reales (el gate can_view_pickem_tables / is_group_member no
-- cambia).
create or replace function public.pickem_weekly_standings(p_group_id uuid, p_week_id uuid)
returns table (user_id uuid, display_name text, correct_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name, count(*) filter (where wp.pick = g.outcome) as correct_count
  from public.weekly_access wa
  join public.profiles p on p.id = wa.user_id
  join public.games g on g.week_id = wa.week_id
  left join public.weekly_picks wp on wp.game_id = g.id and wp.user_id = wa.user_id
  where wa.group_id = p_group_id
    and wa.week_id = p_week_id
    and wa.status = 'aprobado'
    and not public.is_platform_admin(p.id)
    and (not p.is_test_account or public.is_platform_admin(auth.uid()))
    and public.can_view_pickem_tables(p_group_id, auth.uid())
  group by p.id, p.display_name
  order by correct_count desc;
$$;

create or replace function public.pickem_season_standings(p_group_id uuid)
returns table (user_id uuid, display_name text, total_correct bigint)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name, count(*) filter (where wp.pick = g.outcome) as total_correct
  from public.weekly_access wa
  join public.profiles p on p.id = wa.user_id
  join public.games g on g.week_id = wa.week_id
  left join public.weekly_picks wp on wp.game_id = g.id and wp.user_id = wa.user_id
  where wa.group_id = p_group_id
    and wa.status = 'aprobado'
    and not public.is_platform_admin(p.id)
    and (not p.is_test_account or public.is_platform_admin(auth.uid()))
    and public.can_view_pickem_tables(p_group_id, auth.uid())
  group by p.id, p.display_name
  order by total_correct desc;
$$;

create or replace function public.survivor_group_roster(p_group_id uuid)
returns table (
  user_id uuid,
  display_name text,
  current_life int,
  status text,
  first_loss_week_id uuid,
  eliminated_week_id uuid,
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
    ss.final_rank
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  left join public.survivor_state ss on ss.group_id = gm.group_id and ss.user_id = gm.user_id
  where gm.group_id = p_group_id
    and (public.is_group_member(p_group_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    and not public.is_platform_admin(gm.user_id)
    and (not p.is_test_account or public.is_platform_admin(auth.uid()));
$$;
