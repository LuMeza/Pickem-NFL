-- Tareas 1.1/1.5 (modulo-survivor): esquema de datos. Acceso implicito por ser
-- miembro del grupo (ver base-plataforma design.md decision 4 y
-- modulo-survivor proposal/design — no hay flujo de solicitud/aprobacion para
-- este modulo). Alcance: solo semanas de tipo 'regular' (decision de producto,
-- ver design.md decision 1 actualizada — pretemporada/hof quedan fuera para no
-- eliminar a nadie por partidos de exhibicion).
create table if not exists public.survivor_picks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_id uuid not null references public.weeks (id) on delete cascade,
  team_id text not null references public.teams (id),
  life_number int not null default 1 check (life_number in (1, 2, 3)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint survivor_picks_no_repeat_team unique (user_id, group_id, team_id),
  constraint survivor_picks_one_per_week unique (user_id, group_id, week_id)
);

drop trigger if exists survivor_picks_set_updated_at on public.survivor_picks;
create trigger survivor_picks_set_updated_at
  before update on public.survivor_picks
  for each row
  execute function public.set_updated_at();

-- Tarea: life_number registra bajo que vida se hizo el pick (informativo, ver
-- design.md decision 2) — se completa solo, tomando el current_life vigente
-- del usuario en survivor_state (1 si todavia no tiene fila).
create or replace function public.set_survivor_pick_life_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select coalesce(
    (select ss.current_life from public.survivor_state ss
     where ss.group_id = new.group_id and ss.user_id = new.user_id),
    1
  ) into new.life_number;
  return new;
end;
$$;

-- Tarea 1.5: estado acumulado de supervivencia por usuario, recalculado por
-- completo en cada corrida de public.recalculate_survivor_state (ver
-- migracion survivor_processing) en vez de mutado incrementalmente — asi una
-- correccion de resultado ya cargado se resuelve simplemente re-corriendo la
-- funcion (idempotente, ver design.md decision 4/riesgo).
create table if not exists public.survivor_state (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  current_life int not null default 1 check (current_life between 1 and 3),
  status text not null default 'alive' check (status in ('alive', 'eliminated')),
  first_loss_week_id uuid references public.weeks (id),
  eliminated_week_id uuid references public.weeks (id),
  final_rank int check (final_rank in (1, 2, 3)),
  primary key (group_id, user_id)
);

-- El trigger de life_number depende de que survivor_state ya exista.
drop trigger if exists survivor_picks_set_life_number on public.survivor_picks;
create trigger survivor_picks_set_life_number
  before insert on public.survivor_picks
  for each row
  execute function public.set_survivor_pick_life_number();

-- Tarea 1.4: partido correspondiente a (semana, equipo) y si ya inicio.
-- Solo semanas 'regular' son validas para Survivor (decision de producto).
create or replace function public.can_pick_survivor_team(p_group_id uuid, p_uid uuid, p_week_id uuid, p_team_id text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    not exists (
      select 1 from public.survivor_state ss
      where ss.group_id = p_group_id and ss.user_id = p_uid and ss.status = 'eliminated'
    )
    and exists (
      select 1
      from public.games g
      join public.weeks w on w.id = g.week_id
      where g.week_id = p_week_id
        and (g.home_team_id = p_team_id or g.away_team_id = p_team_id)
        and w.type = 'regular'
        and now() < g.kickoff_at
    );
$$;

comment on function public.can_pick_survivor_team(uuid, uuid, uuid, text) is
  'True si p_uid puede elegir p_team_id en p_week_id para Survivor: no esta eliminado, la semana es regular, el equipo tiene partido esa semana y no ha iniciado.';
