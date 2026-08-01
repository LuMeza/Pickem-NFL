-- Roster NFL por equipo ("plantilla"), sincronizado desde ESPN — ver
-- supabase/functions/sync-espn-roster. id = espn athlete id (unico y estable,
-- mas simple que generar uuid propio para algo que ya trae id de origen).
create table if not exists public.players (
  id text primary key,
  team_id text not null references public.teams (id) on delete cascade,
  full_name text not null,
  position text,
  jersey_number text,
  unit text,
  updated_at timestamptz not null default now()
);

create index if not exists players_team_id_idx on public.players (team_id);

alter table public.players enable row level security;

create policy "players_select_authenticated" on public.players
  for select to authenticated using (true);
create policy "players_write_admin_only" on public.players
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
