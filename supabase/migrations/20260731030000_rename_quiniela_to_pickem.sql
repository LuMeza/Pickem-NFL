-- Renombra el modulo "Quiniela" a "Pickem NFL" (rebranding, sin cambio de
-- comportamiento). Se preserva toda la data: la tabla se renombra (no se
-- recrea) y el valor de module_access.module se actualiza en lugar de
-- borrarse.

-- 1. Tabla de configuracion de visibilidad de tablas.
alter table public.quiniela_settings rename to pickem_settings;

alter policy "quiniela_settings_select_authenticated" on public.pickem_settings
  rename to "pickem_settings_select_authenticated";

alter policy "quiniela_settings_write_admin_only" on public.pickem_settings
  rename to "pickem_settings_write_admin_only";

-- 2. Funciones de calculo de tablas de posiciones: se recrean con el nuevo
-- nombre (un simple RENAME no reescribe las referencias internas de una
-- funcion a otra, que quedarian apuntando al nombre viejo).
drop function if exists public.quiniela_weekly_standings(uuid, uuid);
drop function if exists public.quiniela_season_standings(uuid);
drop function if exists public.can_view_quiniela_tables_for_group(uuid);
drop function if exists public.can_view_quiniela_tables(uuid, uuid);

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
      select 1 from public.weekly_access wa
      where wa.group_id = p_group_id and wa.user_id = p_uid and wa.status = 'aprobado'
    )
    or coalesce(
      (select ps.tables_visible_to_all from public.pickem_settings ps where ps.group_id = p_group_id),
      false
    );
$$;

comment on function public.can_view_pickem_tables(uuid, uuid) is
  'True si p_uid puede ver las tablas de posiciones del pickem semanal del grupo: es admin, tuvo acceso semanal aprobado alguna vez, o el admin habilito la visibilidad para todos (pickem_settings).';

create or replace function public.can_view_pickem_tables_for_group(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.can_view_pickem_tables(p_group_id, auth.uid());
$$;

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
    and public.can_view_pickem_tables(p_group_id, auth.uid())
  group by p.id, p.display_name
  order by correct_count desc;
$$;

comment on function public.pickem_weekly_standings(uuid, uuid) is
  'Tabla de posiciones de una semana: aciertos por usuario entre quienes tuvieron weekly_access aprobado esa semana. Vacia si el llamante no puede ver las tablas (can_view_pickem_tables).';

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
    and public.can_view_pickem_tables(p_group_id, auth.uid())
  group by p.id, p.display_name
  order by total_correct desc;
$$;

comment on function public.pickem_season_standings(uuid) is
  'Tabla acumulada de temporada: aciertos totales por usuario, sumando solo las semanas en las que tuvo weekly_access aprobado. Vacia si el llamante no puede ver las tablas.';

-- 3. Valor 'quiniela_semanal' de module_access.module -> 'pickem_semanal'.
alter table public.module_access drop constraint if exists module_access_module_check;

update public.module_access set module = 'pickem_semanal' where module = 'quiniela_semanal';

alter table public.module_access
  add constraint module_access_module_check check (module in ('pickem_semanal', 'survivor', 'playoffs'));
