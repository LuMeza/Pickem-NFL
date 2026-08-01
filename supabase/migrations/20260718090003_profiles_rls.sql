-- Tarea 3.1 (base-plataforma): cada usuario lee/edita solo su propio perfil;
-- platform_admins puede leer todos.
alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_platform_admin(auth.uid()));

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No hay policy de insert para authenticated: la unica via de creacion es la
-- Edge Function admin-create-user, que usa la service role key (bypassa RLS).
