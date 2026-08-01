-- Lectura publica para cualquier autenticado (el cliente necesita saber el
-- flag para decidir que UI mostrar); escritura solo platform_admins.
alter table public.quiniela_settings enable row level security;

create policy "quiniela_settings_select_authenticated"
  on public.quiniela_settings
  for select
  to authenticated
  using (true);

create policy "quiniela_settings_write_admin_only"
  on public.quiniela_settings
  for all
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
