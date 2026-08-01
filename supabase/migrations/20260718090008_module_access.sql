-- Tarea 2.6 (base-plataforma): estado de acceso a un modulo opcional por
-- (grupo, usuario, modulo). Ver design.md decision 4. user_id referencia
-- public.profiles (no auth.users) por la misma razon que group_members: permite
-- embeder "profiles(display_name)" al listar solicitudes (tarea 5.6).
create table if not exists public.module_access (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  module text not null check (module in ('quiniela_semanal', 'survivor', 'playoffs')),
  status text not null default 'solicitado' check (status in ('solicitado', 'aprobado', 'rechazado')),
  requested_at timestamptz not null default now(),
  primary key (group_id, user_id, module)
);
