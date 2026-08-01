-- Tarea 1.1 (modulo-quiniela-semanal): acceso semanal a la quiniela por
-- (grupo, usuario, semana). Ver design.md decision 7 — reemplaza, solo para
-- este modulo, al modelo generico module_access de base-plataforma (que
-- sigue vigente para Survivor y Playoffs).
create table if not exists public.weekly_access (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_id uuid not null references public.weeks (id) on delete cascade,
  status text not null default 'solicitado' check (status in ('solicitado', 'aprobado', 'rechazado')),
  requested_at timestamptz not null default now(),
  primary key (group_id, user_id, week_id)
);

-- Tarea 1.3: helper para el corte de solicitud/aprobacion — true una vez que
-- el partido con kickoff mas temprano de la semana ya inicio. Una semana sin
-- partidos cargados todavia no se considera iniciada.
create or replace function public.week_kickoff_started(p_week_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select now() >= min(g.kickoff_at) from public.games g where g.week_id = p_week_id),
    false
  );
$$;

comment on function public.week_kickoff_started(uuid) is
  'True si ya inicio el primer partido (menor kickoff_at) de la semana. Usada para el corte de weekly_access y weekly_picks.';
