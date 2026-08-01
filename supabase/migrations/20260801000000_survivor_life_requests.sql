-- Feedback de producto (post-implementacion, ver design.md decision 7): las
-- vidas extra (2 y 3) dejan de otorgarse automaticamente al perder. Cada una
-- debe pedirse explicitamente y el admin la aprueba o rechaza, siguiendo el
-- mismo patron de solicitud/aprobacion que ya existe para weekly_access
-- (modulo-pickem-semanal).
create table public.survivor_life_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  life_number int not null check (life_number in (2, 3)),
  status text not null default 'solicitado' check (status in ('solicitado', 'aprobado', 'rechazado')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id),
  constraint survivor_life_requests_one_per_life unique (group_id, user_id, life_number)
);

-- Solo se puede solicitar la vida inmediatamente siguiente a la que se esta
-- pidiendo (current_life + 1), y solo mientras el estado este esperando esa
-- solicitud (ver design.md decision 7 — _survivor_recompute pone el status en
-- 'needs_life_request' cuando detecta la derrota y no hay fila todavia).
create or replace function public.can_request_survivor_life(p_group_id uuid, p_uid uuid, p_life_number int)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.survivor_state ss
    where ss.group_id = p_group_id
      and ss.user_id = p_uid
      and ss.status = 'needs_life_request'
      and ss.current_life + 1 = p_life_number
  );
$$;

comment on function public.can_request_survivor_life(uuid, uuid, int) is
  'True si p_uid puede solicitar la vida p_life_number: su estado esta esperando esa solicitud puntual (ver design.md decision 7).';

alter table public.survivor_life_requests enable row level security;

create policy "survivor_life_requests_select_own_or_admin"
  on public.survivor_life_requests
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));

create policy "survivor_life_requests_insert_own"
  on public.survivor_life_requests
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.can_request_survivor_life(group_id, user_id, life_number)
  );

-- Solo el admin decide, y solo mientras siga 'solicitado' (no se puede
-- redecidir una solicitud ya resuelta).
create policy "survivor_life_requests_update_admin"
  on public.survivor_life_requests
  for update
  to authenticated
  using (public.is_platform_admin(auth.uid()) and status = 'solicitado')
  with check (public.is_platform_admin(auth.uid()) and status in ('aprobado', 'rechazado'));

-- decided_at/decided_by se completan solos al resolver — el admin solo
-- necesita actualizar `status`.
create or replace function public.set_survivor_life_request_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> old.status then
    new.decided_at := now();
    new.decided_by := auth.uid();
  end if;
  return new;
end;
$$;

create trigger survivor_life_requests_set_decision
  before update on public.survivor_life_requests
  for each row
  execute function public.set_survivor_life_request_decision();
