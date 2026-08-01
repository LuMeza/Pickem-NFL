-- Tarea 2.2 (base-plataforma): lista explicita de administradores de plataforma.
-- Un solo rol administrativo global (ver design.md decision 2): no hay owner por grupo.
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.platform_admins enable row level security;

-- Cualquier usuario autenticado puede verificar si el mismo es administrador
-- (usado por el guard de rutas del panel admin, tarea 7.3). No expone la lista completa.
create policy "platform_admins_select_self"
  on public.platform_admins
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Bootstrap del primer administrador (tarea 1.4): se hace manualmente desde el
-- SQL editor de Supabase (fuera de la UI), por ejemplo:
--   insert into public.platform_admins (user_id) values ('<uuid-del-primer-admin>');
-- El user_id debe existir previamente en auth.users (creado desde Authentication > Users).
