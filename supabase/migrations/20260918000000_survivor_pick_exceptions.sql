-- Permite al admin habilitar puntualmente el pick de Survivor de un usuario
-- que no llego a elegir a tiempo, para una semana ya cerrada por horario, sin
-- reabrir esa semana para todo el grupo. Ver
-- openspec/changes/survivor-acceso-excepcional-pick.
create table if not exists public.survivor_pick_exceptions (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_id uuid not null references public.weeks (id) on delete cascade,
  granted_by uuid not null default auth.uid() references public.profiles (id),
  granted_at timestamptz not null default now(),
  primary key (group_id, user_id, week_id)
);

comment on table public.survivor_pick_exceptions is
  'Excepciones puntuales otorgadas por el admin de plataforma para que un usuario pueda registrar su pick de Survivor de una semana aunque ya haya iniciado el primer partido. Existir la fila = excepcion activa; se borra sola al usarse (ver trigger survivor_picks_consume_pick_exception) o el admin la borra a mano para revocarla.';

alter table public.survivor_pick_exceptions enable row level security;

-- Mismo patron que survivor_withdrawals: admin-only por RLS, upsert/delete
-- directo desde el frontend sin pasar por funcion security definer.
create policy "survivor_pick_exceptions_admin_all"
  on public.survivor_pick_exceptions
  for all
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- El propio usuario necesita poder leer si tiene una excepcion activa para
-- pintar el aviso en su pantalla de pick (ver SurvivorPickPage).
create policy "survivor_pick_exceptions_select_own"
  on public.survivor_pick_exceptions
  for select
  to authenticated
  using (user_id = auth.uid());

-- Bypass de horario (ver 20260915000001_survivor_withdrawals.sql para la
-- version previa): se agrega unicamente la condicion de excepcion activa; el
-- resto de las restricciones (eliminado, retirado, equipo valido de la
-- semana) no cambian.
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
    and not exists (
      select 1 from public.survivor_withdrawals sw
      where sw.group_id = p_group_id and sw.user_id = p_uid and sw.withdrawn
    )
    and exists (
      select 1
      from public.games g
      join public.weeks w on w.id = g.week_id
      where g.week_id = p_week_id
        and (g.home_team_id = p_team_id or g.away_team_id = p_team_id)
        and w.type = 'regular'
    )
    and (
      not public.week_kickoff_started(p_week_id)
      or exists (
        select 1 from public.survivor_pick_exceptions ex
        where ex.group_id = p_group_id and ex.user_id = p_uid and ex.week_id = p_week_id
      )
    );
$$;

comment on function public.can_pick_survivor_team(uuid, uuid, uuid, text) is
  'True si p_uid puede elegir p_team_id en p_week_id para Survivor: no esta eliminado, no fue retirado por el admin, la semana es regular, el equipo tiene partido esa semana, y (no inicio el primer partido de la semana o el admin le otorgo una excepcion puntual para esa semana).';

-- Auto-consumo: en cuanto el usuario guarda (o edita) su pick de esa semana,
-- la excepcion deja de hacer falta y desaparece sola.
create or replace function public.consume_survivor_pick_exception()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.survivor_pick_exceptions
  where group_id = new.group_id and user_id = new.user_id and week_id = new.week_id;
  return new;
end;
$$;

drop trigger if exists survivor_picks_consume_pick_exception on public.survivor_picks;
create trigger survivor_picks_consume_pick_exception
  after insert or update on public.survivor_picks
  for each row
  execute function public.consume_survivor_pick_exception();

comment on function public.consume_survivor_pick_exception() is
  'Borra la excepcion de pick (si existia) del usuario/semana del pick recien guardado — asi el acceso excepcional se cierra solo apenas se usa, sin que el admin tenga que revocarlo a mano.';
