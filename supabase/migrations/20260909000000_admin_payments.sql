-- Panel admin (seguimiento de pagos): quien ya pago la apuesta del pickem
-- semanal (por semana) y las vidas de Survivor. Cada vida de Survivor es un
-- cobro independiente -- la 1 al entrar, la 2 y la 3 solo aplican si el
-- usuario la pidio y se le aprobo (ver survivor_life_requests /
-- survivor_state.current_life). Tablas de uso exclusivo del admin: no hay
-- necesidad de que el propio usuario vea si pago, asi que el RLS es
-- admin-only en vez de exponer lectura/escritura propia como weekly_picks.
create table if not exists public.weekly_payments (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_id uuid not null references public.weeks (id) on delete cascade,
  paid boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id, week_id)
);

drop trigger if exists weekly_payments_set_updated_at on public.weekly_payments;
create trigger weekly_payments_set_updated_at
  before update on public.weekly_payments
  for each row
  execute function public.set_updated_at();

alter table public.weekly_payments enable row level security;

create policy "weekly_payments_admin_only"
  on public.weekly_payments
  for all
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create table if not exists public.survivor_payments (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  life_number int not null check (life_number in (1, 2, 3)),
  paid boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id, life_number)
);

drop trigger if exists survivor_payments_set_updated_at on public.survivor_payments;
create trigger survivor_payments_set_updated_at
  before update on public.survivor_payments
  for each row
  execute function public.set_updated_at();

alter table public.survivor_payments enable row level security;

create policy "survivor_payments_admin_only"
  on public.survivor_payments
  for all
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
