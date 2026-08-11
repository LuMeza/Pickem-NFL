-- Tendencia semanal de aciertos del usuario para el perfil: mismo alcance y
-- autorizacion que profile_pickem_summary (ver 20260801000009), pero
-- agrupado por semana para graficar la evolucion reciente en el header del
-- perfil ("ultimas tendencias").
create or replace function public.profile_pickem_weekly_trend(p_user_id uuid)
returns table (
  week_sort_order int,
  week_type text,
  week_number int,
  total_correct bigint,
  total_picked bigint
)
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
    w.sort_order as week_sort_order,
    w.type as week_type,
    w.number as week_number,
    count(*) filter (where wp.pick = g.outcome) as total_correct,
    count(*) filter (where wp.pick is not null and g.outcome is not null) as total_picked
  from public.weekly_access wa
  join public.games g on g.week_id = wa.week_id
  join public.weeks w on w.id = g.week_id
  left join public.weekly_picks wp on wp.game_id = g.id and wp.user_id = wa.user_id
  where wa.user_id = p_user_id
    and wa.status = 'aprobado'
  group by w.sort_order, w.type, w.number
  having count(*) filter (where wp.pick is not null and g.outcome is not null) > 0
  order by w.sort_order desc
  limit 6;
end;
$$;

comment on function public.profile_pickem_weekly_trend(uuid) is
  'Aciertos/partidos con resultado por semana (ultimas 6 semanas con datos), usado por el grafico de tendencia del perfil.';
