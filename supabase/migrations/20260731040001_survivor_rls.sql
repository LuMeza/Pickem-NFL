-- Tarea 1.6 (modulo-survivor).
alter table public.survivor_picks enable row level security;

-- Elecciones: privadas, igual que weekly_picks (el ranking/estado agregado se
-- expone via survivor_state, visible a todo el grupo, y via funciones propias
-- si se necesita mas detalle a futuro).
create policy "survivor_picks_select_own"
  on public.survivor_picks
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "survivor_picks_insert_own"
  on public.survivor_picks
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.can_pick_survivor_team(group_id, user_id, week_id, team_id)
  );

create policy "survivor_picks_update_own"
  on public.survivor_picks
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.can_pick_survivor_team(group_id, user_id, week_id, team_id)
  );

alter table public.survivor_state enable row level security;

-- Estado: visible para cualquier miembro del grupo (tarea 1.6 — "estado de
-- survivor visible para miembros del grupo"), a diferencia de las elecciones.
-- Sin policies de insert/update para authenticated: solo se escribe via
-- public.recalculate_survivor_state (SECURITY DEFINER).
create policy "survivor_state_select_member_or_admin"
  on public.survivor_state
  for select
  to authenticated
  using (
    public.is_platform_admin(auth.uid())
    or public.is_group_member(group_id, auth.uid())
  );
