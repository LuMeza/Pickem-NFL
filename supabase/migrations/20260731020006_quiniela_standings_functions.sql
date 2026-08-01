-- Tareas 4.1/4.2/4.5 (modulo-quiniela-semanal): calculo on-the-fly de la
-- tabla de posiciones (ver design.md decision 2). SECURITY DEFINER porque
-- necesitan leer weekly_picks de todos los usuarios del grupo, algo que la
-- policy "weekly_picks_select_own" no permite; el control de acceso se
-- reimplementa aqui adentro (can_view_quiniela_tables) en vez de heredarlo de
-- RLS.

create or replace function public.can_view_quiniela_tables(p_group_id uuid, p_uid uuid)
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
      (select qs.tables_visible_to_all from public.quiniela_settings qs where qs.group_id = p_group_id),
      false
    );
$$;

comment on function public.can_view_quiniela_tables(uuid, uuid) is
  'True si p_uid puede ver las tablas de posiciones de la quiniela semanal del grupo: es admin, tuvo acceso semanal aprobado alguna vez, o el admin habilito la visibilidad para todos (quiniela_settings).';

-- Callable directamente por el cliente (RPC) para decidir "no visible" vs
-- "sin resultados todavia" sin depender de que una tabla vacia sea ambigua.
create or replace function public.can_view_quiniela_tables_for_group(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.can_view_quiniela_tables(p_group_id, auth.uid());
$$;

create or replace function public.quiniela_weekly_standings(p_group_id uuid, p_week_id uuid)
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
    and public.can_view_quiniela_tables(p_group_id, auth.uid())
  group by p.id, p.display_name
  order by correct_count desc;
$$;

comment on function public.quiniela_weekly_standings(uuid, uuid) is
  'Tabla de posiciones de una semana: aciertos por usuario entre quienes tuvieron weekly_access aprobado esa semana. Vacia si el llamante no puede ver las tablas (can_view_quiniela_tables).';

create or replace function public.quiniela_season_standings(p_group_id uuid)
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
    and public.can_view_quiniela_tables(p_group_id, auth.uid())
  group by p.id, p.display_name
  order by total_correct desc;
$$;

comment on function public.quiniela_season_standings(uuid) is
  'Tabla acumulada de temporada: aciertos totales por usuario, sumando solo las semanas en las que tuvo weekly_access aprobado (tarea 4.2). Vacia si el llamante no puede ver las tablas.';
