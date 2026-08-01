-- Tarea 1.5 (modulo-quiniela-semanal): prediccion de un usuario para un
-- partido. Ver design.md decision 1. group_id se incluye aunque sea
-- derivable de weekly_access/group_members, para que las policies y las
-- futuras queries de tabla de posiciones sean directas por grupo.
create table if not exists public.weekly_picks (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  pick text not null check (pick in ('home', 'away', 'tie')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_picks_user_game_unique unique (user_id, game_id)
);

create index if not exists weekly_picks_group_id_idx on public.weekly_picks (group_id);
create index if not exists weekly_picks_game_id_idx on public.weekly_picks (game_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists weekly_picks_set_updated_at on public.weekly_picks;
create trigger weekly_picks_set_updated_at
  before update on public.weekly_picks
  for each row
  execute function public.set_updated_at();
