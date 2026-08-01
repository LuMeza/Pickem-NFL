-- Tarea 3.1 (sistema-logros-perfil): resumen de aciertos del usuario para el
-- header del perfil, transversal a todos sus grupos (ver design.md decision
-- 5) — a diferencia de pickem_weekly_standings/pickem_season_standings, que
-- son por grupo. Solo el propio usuario o un administrador puede consultarlo.
create or replace function public.profile_pickem_summary(p_user_id uuid)
returns table (total_correct bigint, total_picked bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if p_user_id <> auth.uid() and not public.is_platform_admin(auth.uid()) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    count(*) filter (where wp.pick = g.outcome) as total_correct,
    count(*) filter (where wp.pick is not null and g.outcome is not null) as total_picked
  from public.weekly_access wa
  join public.games g on g.week_id = wa.week_id
  left join public.weekly_picks wp on wp.game_id = g.id and wp.user_id = wa.user_id
  where wa.user_id = p_user_id
    and wa.status = 'aprobado';
end;
$$;

comment on function public.profile_pickem_summary(uuid) is
  'Aciertos totales y partidos con resultado ya definido del usuario, sumando todos los grupos donde tuvo weekly_access aprobado. Usado por el header "stat card" del perfil.';
