-- admin_weekly_picks_for_week (ver 20260814000007_admin_picks_account_flags.sql
-- para la version previa): la vista "Por semana" del panel admin ahora lista
-- solo a quienes hicieron al menos un pick en esa semana. Antes devolvia a
-- todos los miembros del grupo (con picks null), y la matriz se llenaba de
-- filas vacias de gente que ni jugo esa semana.
--
-- Mismo tipo de retorno que la version previa, por eso basta create or replace.
create or replace function public.admin_weekly_picks_for_week(p_group_id uuid, p_week_id uuid)
returns table (
  user_id uuid,
  display_name text,
  game_id uuid,
  pick text,
  outcome text,
  is_admin boolean,
  is_test_account boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    gm.user_id,
    p.display_name,
    g.id as game_id,
    wp.pick,
    g.outcome,
    public.is_platform_admin(gm.user_id) as is_admin,
    p.is_test_account
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  join public.games g on g.week_id = p_week_id
  left join public.weekly_picks wp
    on wp.game_id = g.id and wp.user_id = gm.user_id and wp.group_id = gm.group_id
  where gm.group_id = p_group_id
    and public.is_platform_admin(auth.uid())
    and exists (
      select 1
      from public.weekly_picks wp2
      join public.games g2 on g2.id = wp2.game_id
      where wp2.group_id = gm.group_id
        and wp2.user_id = gm.user_id
        and g2.week_id = p_week_id
        and wp2.pick is not null
    )
  order by p.display_name, g.kickoff_at;
$$;

comment on function public.admin_weekly_picks_for_week(uuid, uuid) is
  'Panel admin: pick de cada partido de la semana (null si no hizo pick en ese partido), solo para miembros del grupo con al menos un pick esa semana. Incluye flags is_admin/is_test_account para que el PDF se pueda filtrar sin tocar la vista en pantalla. Vacio si el llamante no es platform_admin.';
