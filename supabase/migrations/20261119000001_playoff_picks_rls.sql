-- Tareas 1.3/1.4/1.5 (modulo-playoffs): el usuario lee/escribe solo sus
-- propias predicciones. Insert/update exigen: partido de una semana de tipo
-- playoffs, partido no iniciado (now() < kickoff_at) y que el usuario sea
-- miembro del grupo (specs/prediccion-playoffs).
alter table public.playoff_picks enable row level security;

create or replace function public.can_pick_playoff_game(p_game_id uuid, p_group_id uuid, p_uid uuid)
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
      and w.type = 'playoffs'
      and now() < g.kickoff_at
  )
  and public.is_group_member(p_group_id, p_uid);
$$;

comment on function public.can_pick_playoff_game(uuid, uuid, uuid) is
  'True si p_uid puede registrar/editar una prediccion de playoffs para p_game_id en p_group_id: partido de semana playoffs, no iniciado, y usuario miembro del grupo.';

create policy "playoff_picks_select_own"
  on public.playoff_picks
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "playoff_picks_insert_own"
  on public.playoff_picks
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.can_pick_playoff_game(game_id, group_id, user_id)
  );

create policy "playoff_picks_update_own"
  on public.playoff_picks
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.can_pick_playoff_game(game_id, group_id, user_id)
  );
