-- Tareas 1.1/1.2 (modulo-playoffs): prediccion de un usuario para un partido
-- de playoffs, por rango de diferencia de puntos (design.md decisiones 1 y 3).
-- Mismo patron que weekly_picks; group_id se guarda para consultar directo por
-- grupo en las funciones de tabla.
create table if not exists public.playoff_picks (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  pick text not null check (pick in ('local_amplio', 'cerrado', 'visita_amplio')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint playoff_picks_user_game_unique unique (user_id, game_id)
);

create index if not exists playoff_picks_group_id_idx on public.playoff_picks (group_id);
create index if not exists playoff_picks_game_id_idx on public.playoff_picks (game_id);

drop trigger if exists playoff_picks_set_updated_at on public.playoff_picks;
create trigger playoff_picks_set_updated_at
  before update on public.playoff_picks
  for each row
  execute function public.set_updated_at();
