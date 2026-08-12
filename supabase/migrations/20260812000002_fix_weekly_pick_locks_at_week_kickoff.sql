-- Corrige el corte de la Pickem Semanal: can_pick_game cerraba partido por
-- partido (el kickoff de CADA juego individual), permitiendo cargar o
-- cambiar el pick de un partido tardio de la semana con resultados ya
-- conocidos de partidos anteriores de esa misma semana. La regla real es que
-- todos los picks de la semana se cierran juntos en el kickoff del primer
-- partido — mismo criterio que weekly_access y Survivor
-- (public.week_kickoff_started, ver 20260811000006_survivor_pick_locks_at_week_kickoff.sql).
create or replace function public.can_pick_game(p_game_id uuid, p_group_id uuid, p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.games g
    join public.weeks w on w.id = g.week_id
    where g.id = p_game_id
      and w.type in ('hof', 'pretemporada', 'regular')
      and not public.week_kickoff_started(g.week_id)
  );
$$;

comment on function public.can_pick_game(uuid, uuid, uuid) is
  'True si p_uid puede registrar/editar una prediccion para p_game_id en p_group_id: semana valida (no playoffs) y el primer partido de esa semana todavia no inicio (cierre por semana, no por partido).';
