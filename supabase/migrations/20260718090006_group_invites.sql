-- Tarea 2.5 (base-plataforma): codigo de invitacion por grupo. Regenerar
-- desactiva el codigo vigente e inserta uno nuevo (historial de codigos,
-- ver design.md decision 5), en vez de sobreescribir en la misma fila.
create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- A lo sumo un codigo vigente por grupo a la vez.
create unique index if not exists group_invites_one_active_per_group
  on public.group_invites (group_id)
  where is_active;
