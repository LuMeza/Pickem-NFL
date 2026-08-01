-- Panel admin: ver los picks de cualquier usuario en pickem semanal y
-- survivor. El RLS de weekly_picks/survivor_picks solo permite leer filas
-- propias, asi que se agregan funciones security definer que bypassan RLS
-- solo para platform_admins, siguiendo el mismo patron que
-- pickem_weekly_standings (20260731030000_rename_quiniela_to_pickem.sql):
-- el chequeo is_platform_admin(auth.uid()) va en el where, no como
-- excepcion, para que un no-admin reciba 0 filas en vez de un error.
-- left join en todas para que el admin tambien vea "sin pick".

create or replace function public.admin_weekly_picks_for_week(p_group_id uuid, p_week_id uuid)
returns table (
  user_id uuid,
  display_name text,
  game_id uuid,
  pick text,
  outcome text
)
language sql
security definer
set search_path = public
stable
as $$
  select gm.user_id, p.display_name, g.id as game_id, wp.pick, g.outcome
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
  'Panel admin: pick de cada partido de la semana para todos los miembros del grupo (incluye null si no hizo pick). Vacio si el llamante no es platform_admin.';

create or replace function public.admin_survivor_picks_for_week(p_group_id uuid, p_week_id uuid)
returns table (
  user_id uuid,
  display_name text,
  team_id text,
  life_number int,
  status text
)
language sql
security definer
set search_path = public
stable
as $$
  select gm.user_id, p.display_name, sp.team_id, sp.life_number, coalesce(ss.status, 'alive') as status
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
  'Panel admin: pick de survivor de esa semana (o null) y estado actual, para todos los miembros del grupo. Vacio si el llamante no es platform_admin.';

create or replace function public.admin_weekly_picks_for_user(p_group_id uuid, p_user_id uuid)
returns table (
  week_id uuid,
  game_id uuid,
  pick text,
  outcome text
)
language sql
security definer
set search_path = public
stable
as $$
  select g.week_id, g.id as game_id, wp.pick, g.outcome
  from public.games g
  join public.weeks w on w.id = g.week_id
  left join public.weekly_picks wp
    on wp.game_id = g.id and wp.user_id = p_user_id and wp.group_id = p_group_id
  where w.type in ('hof', 'pretemporada', 'regular')
    and public.is_platform_admin(auth.uid())
  order by g.kickoff_at;
$$;

comment on function public.admin_weekly_picks_for_user(uuid, uuid) is
  'Panel admin: historico completo de picks de pickem semanal de un usuario (incluye partidos sin pick). Vacio si el llamante no es platform_admin.';

create or replace function public.admin_survivor_picks_for_user(p_group_id uuid, p_user_id uuid)
returns table (
  week_id uuid,
  team_id text,
  life_number int
)
language sql
security definer
set search_path = public
stable
as $$
  select w.id as week_id, sp.team_id, sp.life_number
  from public.weeks w
  left join public.survivor_picks sp
    on sp.week_id = w.id and sp.user_id = p_user_id and sp.group_id = p_group_id
  where w.type = 'regular'
    and public.is_platform_admin(auth.uid())
  order by w.sort_order;
$$;

comment on function public.admin_survivor_picks_for_user(uuid, uuid) is
  'Panel admin: historico completo de picks de survivor de un usuario (incluye semanas sin pick). Vacio si el llamante no es platform_admin.';
