-- profile_pickem_summary/profile_pickem_weekly_trend solo contaban picks de
-- partidos con resultado ya cargado (g.outcome is not null). Un usuario que
-- ya eligio para partidos que todavia no se juegan (el caso normal en la
-- semana en curso) veia total_picked = 0, y el frontend interpretaba eso
-- como "no tiene picks registrados" -- mensaje enganoso, el dato real es
-- "tiene picks pero ninguno tiene resultado todavia".
--
-- Se agrega total_picks_made (cuenta TODOS los picks del usuario, sin
-- exigir outcome) para que el frontend pueda distinguir "cero picks" de
-- "picks pendientes de resultado". total_correct/total_picked se dejan
-- igual (siguen siendo sobre partidos ya definidos, correctos para calcular
-- % de efectividad).
-- Postgres no permite CREATE OR REPLACE cuando cambia el tipo de retorno
-- (aqui se agrega una columna a la tabla de salida) -- hay que dropear la
-- funcion vieja primero.
drop function if exists public.profile_pickem_summary(uuid);

create function public.profile_pickem_summary(p_user_id uuid)
returns table (total_correct bigint, total_picked bigint, total_picks_made bigint)
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
    count(*) filter (where wp.pick is not null and g.outcome is not null) as total_picked,
    count(*) filter (where wp.pick is not null) as total_picks_made
  from public.weekly_access wa
  join public.games g on g.week_id = wa.week_id
  left join public.weekly_picks wp on wp.game_id = g.id and wp.user_id = wa.user_id
  where wa.user_id = p_user_id
    and wa.status = 'aprobado';
end;
$$;
