-- Tarea 1.8 (modulo-quiniela-semanal): usuario lee/escribe solo sus propias
-- predicciones. Insert/update SHALL exigir (tareas 1.6/1.7/2.4 del
-- prediccion-quiniela-semanal spec): partido de una semana hof/pretemporada/
-- regular (no playoffs), partido no iniciado, y weekly_access "aprobado" del
-- usuario para la semana de ese partido.
alter table public.weekly_picks enable row level security;

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
    join public.weekly_access wa
      on wa.week_id = g.week_id
      and wa.group_id = p_group_id
      and wa.user_id = p_uid
      and wa.status = 'aprobado'
    where g.id = p_game_id
      and w.type in ('hof', 'pretemporada', 'regular')
      and now() < g.kickoff_at
  );
$$;

comment on function public.can_pick_game(uuid, uuid, uuid) is
  'True si p_uid puede registrar/editar una prediccion para p_game_id en p_group_id: semana valida (no playoffs), partido no iniciado, y weekly_access aprobado para esa semana.';

create policy "weekly_picks_select_own"
  on public.weekly_picks
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "weekly_picks_insert_own"
  on public.weekly_picks
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.can_pick_game(game_id, group_id, user_id)
  );

create policy "weekly_picks_update_own"
  on public.weekly_picks
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.can_pick_game(game_id, group_id, user_id)
  );
