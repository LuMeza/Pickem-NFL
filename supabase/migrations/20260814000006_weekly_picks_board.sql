-- Nuevo apartado para usuarios: ver los picks de todos los demas del grupo
-- en una semana de pickem semanal, pero recien cuando la semana entera ya
-- esta bloqueada (para no filtrarle informacion a alguien que todavia no
-- eligio). "Semana entera bloqueada" = ya paso el weekly_pick_group_deadline
-- de cada partido -- por el agrupamiento lunes-con-domingo (ver
-- 20260814000002_weekly_pick_locks_per_day.sql) esto coincide en la
-- practica con "domingo, despues del primer partido" (pedido de producto).
--
-- El RLS de weekly_picks solo permite leer filas propias (ver
-- 20260731020003_weekly_picks_rls.sql), asi que se agrega una funcion
-- security definer que bypassa RLS, mismo patron que
-- admin_weekly_picks_for_week (20260801000003_admin_picks_functions.sql)
-- pero con el gate de visibilidad de usuarios (can_view_pickem_tables, ver
-- 20260731030000_rename_quiniela_to_pickem.sql) en vez de is_platform_admin,
-- y excluyendo admins/cuentas de prueba igual que pickem_weekly_standings
-- (20260811000004/20260811000005) para consistencia con el resto de vistas
-- que ven los jugadores.

create or replace function public.weekly_picks_board_locked(p_week_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.games g where g.week_id = p_week_id)
     and not exists (
       select 1
       from public.games g
       where g.week_id = p_week_id
         and now() < public.weekly_pick_group_deadline(p_week_id, g.kickoff_at)
     );
$$;

comment on function public.weekly_picks_board_locked(uuid) is
  'True si ya arranco el primer partido de cada grupo de dias de la semana (ver weekly_pick_group_deadline) -- recien ahi es seguro mostrarle a los usuarios los picks de los demas.';

create or replace function public.weekly_picks_board_for_week(p_group_id uuid, p_week_id uuid)
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
    and not public.is_platform_admin(p.id)
    and (not p.is_test_account or public.is_platform_admin(auth.uid()))
    and public.can_view_pickem_tables(p_group_id, auth.uid())
    and public.weekly_picks_board_locked(p_week_id)
  order by p.display_name, g.kickoff_at;
$$;

comment on function public.weekly_picks_board_for_week(uuid, uuid) is
  'Pick de cada partido de la semana para todos los miembros del grupo (sin admins ni cuentas de prueba salvo que quien mira sea admin), visible para cualquier usuario con acceso a las tablas (can_view_pickem_tables) una vez que la semana esta totalmente bloqueada (weekly_picks_board_locked). Vacia si no se cumple alguna condicion.';
