-- ===== 20260718090000_platform_admins.sql =====
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

-- ===== 20260718090001_admin_helper_functions.sql =====
-- Funciones auxiliares SECURITY DEFINER usadas por las policies de RLS de las
-- demas tablas (seccion 3). Se marcan SECURITY DEFINER para poder leer
-- platform_admins/group_members sin quedar atrapadas en su propia RLS ni
-- provocar recursion en las policies que las invocan.

create or replace function public.is_platform_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.platform_admins pa where pa.user_id = uid
  );
$$;

comment on function public.is_platform_admin(uuid) is
  'True si uid pertenece a platform_admins. Usada por las policies de RLS de todas las tablas.';

-- ===== 20260718090002_profiles.sql =====
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

-- ===== 20260718090003_profiles_rls.sql =====
-- Tarea 3.1 (base-plataforma): cada usuario lee/edita solo su propio perfil;
-- platform_admins puede leer todos.
alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_platform_admin(auth.uid()));

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No hay policy de insert para authenticated: la unica via de creacion es la
-- Edge Function admin-create-user, que usa la service role key (bypassa RLS).

-- ===== 20260718090004_groups_and_members.sql =====
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

-- ===== 20260718090005_groups_and_members_rls.sql =====
-- Tarea 3.2 (base-plataforma): solo miembros (y platform_admins) leen datos de
-- su grupo; solo platform_admins crea grupos y administra miembros.

-- Helper adicional: evita recursion directa de group_members sobre si misma
-- dentro de su propia policy de SELECT.
create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = gid and gm.user_id = uid
  );
$$;

comment on function public.is_group_member(uuid, uuid) is
  'True si uid pertenece al grupo gid. SECURITY DEFINER para no recursar sobre la RLS de group_members.';

alter table public.groups enable row level security;

create policy "groups_select_member_or_admin"
  on public.groups
  for select
  to authenticated
  using (
    public.is_platform_admin(auth.uid())
    or public.is_group_member(id, auth.uid())
  );

-- Sin policy de insert/update/delete para authenticated: la creacion de grupos
-- solo ocurre via la funcion RPC create_group (SECURITY DEFINER, ver
-- migracion group_functions_and_rls), que valida platform_admins internamente.

alter table public.group_members enable row level security;

create policy "group_members_select_member_or_admin"
  on public.group_members
  for select
  to authenticated
  using (
    public.is_platform_admin(auth.uid())
    or public.is_group_member(group_id, auth.uid())
  );

create policy "group_members_delete_admin_only"
  on public.group_members
  for delete
  to authenticated
  using (public.is_platform_admin(auth.uid()));

-- Sin policy de insert: la union a un grupo solo ocurre via la funcion RPC
-- join_group_by_code (SECURITY DEFINER), nunca por insert directo del cliente.

-- ===== 20260718090006_group_invites.sql =====
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

-- ===== 20260718090007_group_functions_and_rls.sql =====
-- Tareas 3.3 y 3.4 (base-plataforma): funciones RPC SECURITY DEFINER para
-- crear grupo, regenerar codigo y unirse por codigo; y RLS de group_invites.
-- Ver design.md decision 5.

alter table public.group_invites enable row level security;

create policy "group_invites_select_admin_only"
  on public.group_invites
  for select
  to authenticated
  using (public.is_platform_admin(auth.uid()));

-- Sin policy de insert/update para authenticated: solo las funciones RPC de
-- abajo (SECURITY DEFINER) escriben en esta tabla.

create or replace function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$$;

create or replace function public.create_group(group_name text)
returns table (group_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group_id uuid;
  new_code text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Solo un administrador de plataforma puede crear grupos';
  end if;

  insert into public.groups (name) values (group_name) returning id into new_group_id;

  new_code := public.generate_invite_code();
  insert into public.group_invites (group_id, code, is_active)
    values (new_group_id, new_code, true);

  return query select new_group_id, new_code;
end;
$$;

create or replace function public.regenerate_invite_code(p_group_id uuid)
returns table (code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Solo un administrador de plataforma puede regenerar el codigo de invitacion';
  end if;

  update public.group_invites
    set is_active = false
    where group_id = p_group_id and is_active;

  new_code := public.generate_invite_code();
  insert into public.group_invites (group_id, code, is_active)
    values (p_group_id, new_code, true);

  return query select new_code;
end;
$$;

create or replace function public.join_group_by_code(p_code text)
returns table (group_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
begin
  select gi.group_id into target_group_id
  from public.group_invites gi
  where gi.code = p_code and gi.is_active
  limit 1;

  if target_group_id is null then
    raise exception 'Codigo de invitacion invalido o revocado';
  end if;

  insert into public.group_members (group_id, user_id)
    values (target_group_id, auth.uid())
    on conflict (group_id, user_id) do nothing;

  return query select target_group_id;
end;
$$;

-- ===== 20260718090008_module_access.sql =====
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

-- ===== 20260718090009_module_access_rls.sql =====
-- Tarea 3.5 (base-plataforma): usuario ve/crea su propia solicitud; solo
-- platform_admins aprueba/rechaza y ve todas las del grupo.
alter table public.module_access enable row level security;

create policy "module_access_select_own_or_admin"
  on public.module_access
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));

-- El usuario solo puede crear su propia solicitud, y solo en estado
-- "solicitado" (no puede auto-aprobarse via upsert).
create policy "module_access_insert_own_request"
  on public.module_access
  for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'solicitado');

-- Solo el administrador puede aprobar/rechazar (cambiar el estado de una
-- solicitud existente).
create policy "module_access_update_admin_only"
  on public.module_access
  for update
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- ===== 20260718090010_teams.sql =====
-- Tarea 2.7 (base-plataforma): catalogo de los 32 equipos de la NFL.
-- id = abreviatura estandar de 2-3 letras (mas legible que un uuid en el catalogo).
create table if not exists public.teams (
  id text primary key,
  name text not null
);

insert into public.teams (id, name) values
  ('ARI', 'Arizona Cardinals'),
  ('ATL', 'Atlanta Falcons'),
  ('BAL', 'Baltimore Ravens'),
  ('BUF', 'Buffalo Bills'),
  ('CAR', 'Carolina Panthers'),
  ('CHI', 'Chicago Bears'),
  ('CIN', 'Cincinnati Bengals'),
  ('CLE', 'Cleveland Browns'),
  ('DAL', 'Dallas Cowboys'),
  ('DEN', 'Denver Broncos'),
  ('DET', 'Detroit Lions'),
  ('GB', 'Green Bay Packers'),
  ('HOU', 'Houston Texans'),
  ('IND', 'Indianapolis Colts'),
  ('JAX', 'Jacksonville Jaguars'),
  ('KC', 'Kansas City Chiefs'),
  ('LAC', 'Los Angeles Chargers'),
  ('LAR', 'Los Angeles Rams'),
  ('LV', 'Las Vegas Raiders'),
  ('MIA', 'Miami Dolphins'),
  ('MIN', 'Minnesota Vikings'),
  ('NE', 'New England Patriots'),
  ('NO', 'New Orleans Saints'),
  ('NYG', 'New York Giants'),
  ('NYJ', 'New York Jets'),
  ('PHI', 'Philadelphia Eagles'),
  ('PIT', 'Pittsburgh Steelers'),
  ('SEA', 'Seattle Seahawks'),
  ('SF', 'San Francisco 49ers'),
  ('TB', 'Tampa Bay Buccaneers'),
  ('TEN', 'Tennessee Titans'),
  ('WAS', 'Washington Commanders')
on conflict (id) do nothing;

-- ===== 20260718090011_weeks.sql =====
-- Tarea 2.8 (base-plataforma): semanas de temporada, incluida pretemporada.
-- sort_order da el orden cronologico explicito (ver design.md decision 6).
create table if not exists public.weeks (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('pretemporada', 'regular', 'playoffs')),
  number int not null,
  sort_order int not null unique
);

insert into public.weeks (type, number, sort_order)
select 'pretemporada', n, n
from generate_series(1, 3) as n
on conflict (sort_order) do nothing;

insert into public.weeks (type, number, sort_order)
select 'regular', n, n + 3
from generate_series(1, 18) as n
on conflict (sort_order) do nothing;

-- 1=Wild Card, 2=Divisional, 3=Conference Championship, 4=Super Bowl.
insert into public.weeks (type, number, sort_order)
select 'playoffs', n, n + 21
from generate_series(1, 4) as n
on conflict (sort_order) do nothing;

-- ===== 20260718090012_games.sql =====
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

-- ===== 20260718090013_games_result_columns.sql =====
-- Tarea 2.10 (base-plataforma): resultado oficial del partido. outcome/scores
-- nullable mientras no se haya jugado o cargado; result_source distingue
-- carga manual de una futura sincronizacion automatica (ver design.md,
-- Open Questions, y specs/carga-resultados).
alter table public.games
  add column if not exists outcome text check (outcome in ('home', 'away', 'tie')),
  add column if not exists home_score int,
  add column if not exists away_score int,
  add column if not exists result_source text check (result_source in ('manual', 'auto_sync'));

-- Precedencia permanente de la carga manual (specs/carga-resultados,
-- Requirement "Origen del resultado y precedencia de la carga manual"):
-- una escritura con result_source = 'auto_sync' nunca puede sobreescribir un
-- resultado marcado como 'manual'. La sincronizacion automatica en si se
-- implementa en un change aparte (integracion-resultados-espn); esta funcion
-- protege el dato desde ahora sin importar quien escriba despues.
create or replace function public.enforce_manual_result_precedence()
returns trigger
language plpgsql
as $$
begin
  if old.result_source = 'manual' and new.result_source = 'auto_sync' then
    new.outcome := old.outcome;
    new.home_score := old.home_score;
    new.away_score := old.away_score;
    new.result_source := old.result_source;
  end if;
  return new;
end;
$$;

drop trigger if exists games_manual_precedence on public.games;
create trigger games_manual_precedence
  before update on public.games
  for each row
  execute function public.enforce_manual_result_precedence();

-- ===== 20260718090014_catalog_rls.sql =====
-- Tarea 3.6 (base-plataforma): lectura publica para autenticados, escritura
-- solo para platform_admins (catalogo NFL: teams/weeks/games).
alter table public.teams enable row level security;
alter table public.weeks enable row level security;
alter table public.games enable row level security;

create policy "teams_select_authenticated" on public.teams
  for select to authenticated using (true);
create policy "teams_write_admin_only" on public.teams
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy "weeks_select_authenticated" on public.weeks
  for select to authenticated using (true);
create policy "weeks_write_admin_only" on public.weeks
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy "games_select_authenticated" on public.games
  for select to authenticated using (true);
create policy "games_write_admin_only" on public.games
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

