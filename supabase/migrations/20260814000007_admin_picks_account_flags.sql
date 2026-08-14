-- El panel admin ("Picks de usuarios") sigue mostrando a todos los
-- miembros del grupo, admins y cuentas de prueba incluidos -- sirve para
-- que el admin revise/pruebe el sistema con su propia cuenta. Pero el PDF
-- que se genera desde ahí es para mandarselo a los jugadores reales, asi
-- que esas filas sobran ahí (mismo criterio que ya excluye admins/cuentas
-- de prueba de las tablas de posiciones, ver
-- 20260811000004_hide_test_accounts_from_standings.sql y
-- 20260811000005_hide_admins_from_standings.sql). Se agregan las columnas
-- para que el filtro se aplique client-side solo al armar el PDF, sin
-- tocar la vista en pantalla.
--
-- drop explicito antes de recrear: postgres no permite CREATE OR REPLACE
-- cuando cambian las columnas de salida (OUT params), solo el cuerpo.
drop function if exists public.admin_weekly_picks_for_week(uuid, uuid);
drop function if exists public.admin_survivor_picks_for_week(uuid, uuid);

create function public.admin_weekly_picks_for_week(p_group_id uuid, p_week_id uuid)
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
  order by p.display_name, g.kickoff_at;
$$;

comment on function public.admin_weekly_picks_for_week(uuid, uuid) is
  'Panel admin: pick de cada partido de la semana para todos los miembros del grupo (incluye null si no hizo pick, y flags is_admin/is_test_account para que el PDF se pueda filtrar sin tocar la vista en pantalla). Vacio si el llamante no es platform_admin.';

create function public.admin_survivor_picks_for_week(p_group_id uuid, p_week_id uuid)
returns table (
  user_id uuid,
  display_name text,
  team_id text,
  life_number int,
  status text,
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
    sp.team_id,
    sp.life_number,
    coalesce(ss.status, 'alive') as status,
    public.is_platform_admin(gm.user_id) as is_admin,
    p.is_test_account
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  left join public.survivor_picks sp
    on sp.user_id = gm.user_id and sp.group_id = gm.group_id and sp.week_id = p_week_id
  left join public.survivor_state ss
    on ss.user_id = gm.user_id and ss.group_id = gm.group_id
  where gm.group_id = p_group_id
    and public.is_platform_admin(auth.uid())
  order by p.display_name;
$$;

comment on function public.admin_survivor_picks_for_week(uuid, uuid) is
  'Panel admin: pick de survivor de esa semana (o null) y estado actual, para todos los miembros del grupo (incluye flags is_admin/is_test_account para que el PDF se pueda filtrar sin tocar la vista en pantalla). Vacio si el llamante no es platform_admin.';
