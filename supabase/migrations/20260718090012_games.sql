-- Tarea 2.9 (base-plataforma): partidos por semana.
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks (id) on delete cascade,
  home_team_id text not null references public.teams (id),
  away_team_id text not null references public.teams (id),
  kickoff_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint games_home_away_different check (home_team_id <> away_team_id)
);

create index if not exists games_week_id_idx on public.games (week_id);
