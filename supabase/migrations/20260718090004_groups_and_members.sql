-- Tareas 2.3 y 2.4 (base-plataforma): grupos privados y su membresia.
-- group_members no tiene columna de rol (ver design.md decision 2): los
-- permisos administrativos se resuelven contra platform_admins, no contra el grupo.
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- user_id referencia public.profiles (no auth.users directamente) para que
-- PostgREST pueda embeder "profiles(display_name)" al listar miembros
-- (SupabaseGroupRepository.listMembers). profiles.id ya tiene FK a
-- auth.users con on delete cascade, asi que la cadena de borrado se preserva.
create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
