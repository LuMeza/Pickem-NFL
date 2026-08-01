-- Tarea 3.5 (base-plataforma): usuario ve/crea su propia solicitud; solo
-- platform_admins aprueba/rechaza y ve todas las del grupo.
alter table public.module_access enable row level security;

create policy "module_access_select_own_or_admin"
  on public.module_access
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));

-- El usuario solo puede crear su propia solicitud, y solo en estado
-- "solicitado" (no puede auto-aprobarse via upsert).
create policy "module_access_insert_own_request"
  on public.module_access
  for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'solicitado');

-- Solo el administrador puede aprobar/rechazar (cambiar el estado de una
-- solicitud existente).
create policy "module_access_update_admin_only"
  on public.module_access
  for update
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
