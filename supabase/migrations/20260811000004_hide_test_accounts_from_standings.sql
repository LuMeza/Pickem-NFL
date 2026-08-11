-- Oculta las cuentas de prueba del dueño del proyecto (mezac.lu@gmail.com,
-- lupizmezac@gmail.com) de las tablas de posiciones que ven los jugadores
-- normales (Pickem Semanal y Survivor), sin ocultarlas de los admins ni de
-- las pantallas de administracion (esas ya son admin-only, no se tocan).
--
-- Columna nueva en vez de una lista de emails hardcodeada en cada funcion
-- SQL: mismo criterio que platform_admins/is_platform_admin, un solo lugar
-- de verdad que no hay que duplicar si algun dia cambia que cuentas son
-- "de prueba".
alter table public.profiles
  add column if not exists is_test_account boolean not null default false;

update public.profiles
set is_test_account = true
where email in ('mezac.lu@gmail.com', 'lupizmezac@gmail.com');

-- Pickem Semanal: se agrega el filtro de cuenta de prueba al WHERE
-- existente, sin tocar el gate can_view_pickem_tables (base-plataforma /
-- 20260731030000_rename_quiniela_to_pickem.sql).
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
    and (not p.is_test_account or public.is_platform_admin(auth.uid()))
    and public.can_view_pickem_tables(p_group_id, auth.uid())
  group by p.id, p.display_name
  order by total_correct desc;
$$;

-- Survivor: "Estado del grupo" hoy lee group_members + survivor_state
-- directo desde el frontend via PostgREST (dos SELECT protegidos solo por
-- RLS de membresia, sin gate de cuenta de prueba posible ahi porque RLS no
-- puede filtrar cruzando a otra fila de profiles limpiamente). Se reemplaza
-- por una funcion RPC SECURITY DEFINER, mismo patron que pickem_*_standings,
-- que hace el join server-side y filtra cuentas de prueba salvo admin.
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
    and (not p.is_test_account or public.is_platform_admin(auth.uid()));
$$;

comment on function public.survivor_group_roster(uuid) is
  'Reemplaza la lectura directa de group_members+survivor_state desde el frontend: hace el join server-side (SECURITY DEFINER) y oculta profiles.is_test_account salvo que quien llama sea platform_admin.';
