-- Tareas 2.1-2.6 (sistema-logros-perfil): evaluacion y desbloqueo de logros.
-- Todo insert es "on conflict do nothing" (design.md decision 4: idempotente,
-- sin revocacion). Las funciones _evaluate_* son internas (sin grants
-- publicos, mismo patron que public._survivor_recompute) y se conectan a los
-- triggers existentes en la migracion siguiente.

-- pickem_primer_pick es el unico logro que no depende de un resultado de
-- partido (solo de haber registrado un pick) — se evalua con un trigger
-- propio sobre weekly_picks en vez de esperar al trigger de resultados.
create or replace function public._evaluate_pickem_primer_pick_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_achievements (user_id, achievement_id, group_id)
  values (new.user_id, 'pickem_primer_pick', null)
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;
  return null;
end;
$$;

drop trigger if exists weekly_picks_evaluate_primer_pick on public.weekly_picks;
create trigger weekly_picks_evaluate_primer_pick
  after insert on public.weekly_picks
  for each row
  execute function public._evaluate_pickem_primer_pick_trigger();

-- Tarea 2.1: logros de Pickem Semanal que si dependen de resultados oficiales
-- (semana perfecta, racha de 5, liderazgo semanal), evaluados por grupo.
-- Reimplementa la agregacion de pickem_weekly_standings sin el filtro de
-- visibilidad (can_view_pickem_tables): la evaluacion de logros es un hecho
-- objetivo, no una consulta de un usuario con permisos particulares.
create or replace function public._evaluate_pickem_achievements_for_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- pickem_semana_perfecta: semanas de este grupo ya resueltas (>=3 partidos,
  -- todos con outcome) donde el usuario acerto el 100% de sus picks.
  with resolved_weeks as (
    select wa.week_id
    from public.weekly_access wa
    where wa.group_id = p_group_id and wa.status = 'aprobado'
    group by wa.week_id
    having (select count(*) from public.games g where g.week_id = wa.week_id) >= 3
       and not exists (select 1 from public.games g where g.week_id = wa.week_id and g.outcome is null)
  ),
  perfect as (
    select wa.user_id
    from public.weekly_access wa
    join resolved_weeks rw on rw.week_id = wa.week_id
    join public.games g on g.week_id = wa.week_id
    left join public.weekly_picks wp on wp.game_id = g.id and wp.user_id = wa.user_id
    where wa.group_id = p_group_id and wa.status = 'aprobado'
    group by wa.user_id, wa.week_id
    having count(*) filter (where wp.pick = g.outcome) = count(*)
  )
  insert into public.user_achievements (user_id, achievement_id, group_id)
  select distinct user_id, 'pickem_semana_perfecta', p_group_id from perfect
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;

  -- pickem_lider_semana: primer puesto (o empatado) en semanas ya resueltas
  -- con al menos un partido.
  with resolved_weeks as (
    select wa.week_id
    from public.weekly_access wa
    where wa.group_id = p_group_id and wa.status = 'aprobado'
    group by wa.week_id
    having exists (select 1 from public.games g where g.week_id = wa.week_id)
       and not exists (select 1 from public.games g where g.week_id = wa.week_id and g.outcome is null)
  ),
  week_scores as (
    select wa.week_id, wa.user_id,
      count(*) filter (where wp.pick = g.outcome) as correct_count
    from public.weekly_access wa
    join resolved_weeks rw on rw.week_id = wa.week_id
    join public.games g on g.week_id = wa.week_id
    left join public.weekly_picks wp on wp.game_id = g.id and wp.user_id = wa.user_id
    where wa.group_id = p_group_id and wa.status = 'aprobado'
    group by wa.week_id, wa.user_id
  ),
  leaders as (
    select week_id, user_id
    from (
      select week_id, user_id, correct_count,
        rank() over (partition by week_id order by correct_count desc) as pos
      from week_scores
    ) ranked
    where pos = 1 and correct_count > 0
  )
  insert into public.user_achievements (user_id, achievement_id, group_id)
  select distinct user_id, 'pickem_lider_semana', p_group_id from leaders
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;

  -- pickem_racha_5: 5 aciertos consecutivos (por kickoff_at) entre los picks
  -- con resultado ya definido de este grupo. Tecnica "gaps and islands":
  -- (numero de fila global) - (numero de fila dentro de user_id+hit) es
  -- constante durante una racha continua de aciertos/fallos.
  with ordered as (
    select wa.user_id, g.kickoff_at, (wp.pick = g.outcome) as hit
    from public.weekly_access wa
    join public.games g on g.week_id = wa.week_id
    join public.weekly_picks wp on wp.game_id = g.id and wp.user_id = wa.user_id
    where wa.group_id = p_group_id and wa.status = 'aprobado' and g.outcome is not null
  ),
  numbered as (
    select user_id, hit,
      row_number() over (partition by user_id order by kickoff_at) as rn,
      row_number() over (partition by user_id, hit order by kickoff_at) as grp_rn
    from ordered
  ),
  streaks as (
    select user_id, hit, count(*) as streak_len
    from numbered
    group by user_id, hit, (rn - grp_rn)
  )
  insert into public.user_achievements (user_id, achievement_id, group_id)
  select distinct user_id, 'pickem_racha_5', p_group_id
  from streaks
  where hit and streak_len >= 5
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;
end;
$$;

revoke all on function public._evaluate_pickem_achievements_for_group(uuid) from public;
revoke all on function public._evaluate_pickem_achievements_for_group(uuid) from authenticated;

comment on function public._evaluate_pickem_achievements_for_group(uuid) is
  'Logica interna de desbloqueo de logros de Pickem Semanal, sin chequeo de permisos — invocar solo desde el trigger de resultados o desde recalculate_achievements.';

-- Tarea 2.2/2.6: logros de Survivor + doble_jugador, evaluados por grupo.
-- Se invoca desde el final de _survivor_recompute (migracion siguiente), una
-- vez que public.survivor_state ya quedo actualizado para el grupo.
create or replace function public._evaluate_survivor_achievements_for_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_regular_weeks_total int;
  v_regular_weeks_resolved int;
begin
  select count(*) into v_regular_weeks_total from public.weeks where type = 'regular';
  select count(*) into v_regular_weeks_resolved
    from public.weeks w
    where w.type = 'regular'
      and exists (select 1 from public.games g where g.week_id = w.id)
      and not exists (select 1 from public.games g where g.week_id = w.id and g.outcome is null);

  -- survivor_temporada_regular: sigue "alive" y ya no quedan semanas
  -- regulares del catalogo por resolver.
  if v_regular_weeks_resolved >= v_regular_weeks_total then
    insert into public.user_achievements (user_id, achievement_id, group_id)
    select ss.user_id, 'survivor_temporada_regular', p_group_id
    from public.survivor_state ss
    where ss.group_id = p_group_id and ss.status = 'alive'
    on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
    do nothing;
  end if;

  -- survivor_podio: final_rank ya asignado (1, 2 o 3).
  insert into public.user_achievements (user_id, achievement_id, group_id)
  select ss.user_id, 'survivor_podio', p_group_id
  from public.survivor_state ss
  where ss.group_id = p_group_id and ss.final_rank is not null
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;

  -- survivor_vida_intacta: nunca uso vida extra (current_life = 1) y ya llego
  -- a un estado de cierre (eliminado, o vivo al terminar la temporada
  -- regular). No se otorga mientras el usuario sigue jugando con vida 1.
  insert into public.user_achievements (user_id, achievement_id, group_id)
  select ss.user_id, 'survivor_vida_intacta', p_group_id
  from public.survivor_state ss
  where ss.group_id = p_group_id
    and ss.current_life = 1
    and (
      ss.status = 'eliminated'
      or (ss.status = 'alive' and v_regular_weeks_resolved >= v_regular_weeks_total)
    )
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;

  -- doble_jugador: acceso aprobado a Pickem Semanal y al menos un pick de
  -- Survivor, ambos dentro de este mismo grupo.
  insert into public.user_achievements (user_id, achievement_id, group_id)
  select distinct wa.user_id, 'doble_jugador', p_group_id
  from public.weekly_access wa
  where wa.group_id = p_group_id
    and wa.status = 'aprobado'
    and exists (
      select 1 from public.survivor_picks sp
      where sp.group_id = p_group_id and sp.user_id = wa.user_id
    )
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;
end;
$$;

revoke all on function public._evaluate_survivor_achievements_for_group(uuid) from public;
revoke all on function public._evaluate_survivor_achievements_for_group(uuid) from authenticated;

comment on function public._evaluate_survivor_achievements_for_group(uuid) is
  'Logica interna de desbloqueo de logros de Survivor y doble_jugador, sin chequeo de permisos — invocar solo desde _survivor_recompute o desde recalculate_achievements.';

-- Tarea 2.5: veterano se evalua de forma perezosa (no depende de ningun
-- trigger de resultado) — el propio usuario la dispara al consultar su
-- perfil. Sin chequeo de admin: cada usuario solo puede sincronizar sus
-- propios logros generales.
create or replace function public.sync_my_achievements()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_achievements (user_id, achievement_id, group_id)
  select p.id, 'veterano', null
  from public.profiles p
  where p.id = auth.uid()
    and p.created_at <= now() - interval '1 year'
  on conflict (user_id, achievement_id, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do nothing;
end;
$$;

comment on function public.sync_my_achievements() is
  'Evaluacion perezosa de logros generales que no dependen de un trigger de resultado (hoy: veterano). Se invoca al consultar el propio perfil.';

-- Tarea 2.4: plan B manual para el administrador, mismo patron que
-- recalculate_survivor_state.
create or replace function public.recalculate_achievements(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Solo un administrador puede recalcular logros';
  end if;
  perform public._evaluate_pickem_achievements_for_group(p_group_id);
  perform public._evaluate_survivor_achievements_for_group(p_group_id);
end;
$$;

comment on function public.recalculate_achievements(uuid) is
  'Panel admin (plan B): recalcula los logros de Pickem y Survivor de un grupo a mano, por si la evaluacion automatica no corrio.';
