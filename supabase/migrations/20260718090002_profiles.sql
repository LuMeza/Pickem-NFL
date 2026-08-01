-- Tarea 2.1 (base-plataforma): perfil basico ligado a auth.users.
-- La fila se crea desde la Edge Function admin-create-user (service role,
-- bypassa RLS) en el momento del alta — ver design.md decision 3.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email text not null,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);
