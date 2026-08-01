-- Tarea 1.3/1.4 (sistema-logros-perfil): logros desbloqueados por usuario.
-- group_id nullable: null para logros globales (veterano, pickem_primer_pick),
-- con el id del grupo para logros por grupo (semana perfecta, podio, etc.) —
-- ver design.md decision 2. El indice unico trata group_id null como un
-- valor fijo (sentinel) para que un logro global no pueda duplicarse, sin
-- impedir obtener el mismo logro "por grupo" en mas de un grupo.
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id text not null references public.achievements (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  unlocked_at timestamptz not null default now()
);

create unique index if not exists user_achievements_unique_idx
  on public.user_achievements (
    user_id,
    achievement_id,
    coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists user_achievements_user_id_idx on public.user_achievements (user_id);

alter table public.user_achievements enable row level security;

-- Tarea 1.4 / design.md decision 6: solo lectura propia (o admin) en v1 — no
-- se exponen logros de otros miembros del grupo. Insercion exclusiva de las
-- funciones SECURITY DEFINER de evaluacion (sin policy de insert/update para
-- usuarios autenticados), mismo patron que public.survivor_state.
create policy "user_achievements_select_own_or_admin" on public.user_achievements
  for select to authenticated
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));

comment on table public.user_achievements is
  'Logros desbloqueados por usuario (y por grupo cuando aplica). Insertado solo por funciones SECURITY DEFINER de evaluacion — ver openspec/changes/sistema-logros-perfil design.md decisiones 2-4.';
