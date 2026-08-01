-- Tarea 3.6 (base-plataforma): lectura publica para autenticados, escritura
-- solo para platform_admins (catalogo NFL: teams/weeks/games).
alter table public.teams enable row level security;
alter table public.weeks enable row level security;
alter table public.games enable row level security;

create policy "teams_select_authenticated" on public.teams
  for select to authenticated using (true);
create policy "teams_write_admin_only" on public.teams
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy "weeks_select_authenticated" on public.weeks
  for select to authenticated using (true);
create policy "weeks_write_admin_only" on public.weeks
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy "games_select_authenticated" on public.games
  for select to authenticated using (true);
create policy "games_write_admin_only" on public.games
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
