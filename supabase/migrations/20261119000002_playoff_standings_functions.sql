-- Tareas 3.1/3.2/3.3 (modulo-playoffs): clasificacion del resultado oficial y
-- tablas on-the-fly (design.md decisiones 2, 4 y 5). SECURITY DEFINER porque
-- leen playoff_picks de todo el grupo, algo que "playoff_picks_select_own" no
-- permite; el control de acceso se reimplementa adentro.

-- Fuente SQL de la regla de classifyPointDifference (frontend/src/core/rules).
-- Margen > 6 gana el lado amplio; todo lo demas (incluye margen = 6 y empate)
-- es 'cerrado'. Sin marcador oficial completo devuelve null (aun no cuenta).
create or replace function public.playoff_result_category(p_home_score int, p_away_score int)
returns text
language sql
immutable
as $$
  select case
    when p_home_score is null or p_away_score is null then null
    when p_home_score - p_away_score > 6 then 'local_amplio'
    when p_away_score - p_home_score > 6 then 'visita_amplio'
    else 'cerrado'
  end;
$$;

comment on function public.playoff_result_category(int, int) is
  'Clasifica un marcador oficial: local_amplio / visita_amplio si el margen es mayor a 6, cerrado en cualquier otro caso (margen <= 6 o empate). Null si falta algun marcador.';

create or replace function public.can_view_playoff_tables(p_group_id uuid, p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_platform_admin(p_uid) or public.is_group_member(p_group_id, p_uid);
$$;

create or replace function public.can_view_playoff_tables_for_group(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.can_view_playoff_tables(p_group_id, auth.uid());
$$;

-- Aciertos por usuario en una ronda de playoffs (p_week_id).
create or replace function public.playoff_round_standings(p_group_id uuid, p_week_id uuid)
returns table (user_id uuid, display_name text, correct_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name,
    count(*) filter (
      where pp.pick = public.playoff_result_category(g.home_score, g.away_score)
    ) as correct_count
  from public.playoff_picks pp
  join public.profiles p on p.id = pp.user_id
  join public.games g on g.id = pp.game_id
  join public.weeks w on w.id = g.week_id
  where pp.group_id = p_group_id
    and w.type = 'playoffs'
    and g.week_id = p_week_id
    and public.can_view_playoff_tables(p_group_id, auth.uid())
  group by p.id, p.display_name
  order by correct_count desc, p.display_name;
$$;

comment on function public.playoff_round_standings(uuid, uuid) is
  'Aciertos por usuario en una ronda de playoffs, entre quienes hicieron al menos un pick en ella. Vacia si el llamante no es miembro del grupo ni admin.';

-- Ranking final: aciertos acumulados en toda la ronda de playoffs.
create or replace function public.playoff_final_standings(p_group_id uuid)
returns table (user_id uuid, display_name text, total_correct bigint)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name,
    count(*) filter (
      where pp.pick = public.playoff_result_category(g.home_score, g.away_score)
    ) as total_correct
  from public.playoff_picks pp
  join public.profiles p on p.id = pp.user_id
  join public.games g on g.id = pp.game_id
  join public.weeks w on w.id = g.week_id
  where pp.group_id = p_group_id
    and w.type = 'playoffs'
    and public.can_view_playoff_tables(p_group_id, auth.uid())
  group by p.id, p.display_name
  order by total_correct desc, p.display_name;
$$;

comment on function public.playoff_final_standings(uuid) is
  'Ranking final de playoffs: aciertos totales por usuario. Los empates se resuelven en cliente (resolveTiedRanking), sin desempate.';
