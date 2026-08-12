-- Tarea 1.1/1.2 (sistema-logros-perfil): catalogo fijo de logros del sistema.
-- Ver design.md decision 1 — sembrado por migracion, sin panel admin en v1.
create table if not exists public.achievements (
  id text primary key,
  scope text not null check (scope in ('pickem', 'survivor', 'general')),
  title text not null,
  description text not null,
  created_at timestamptz not null default now()
);

alter table public.achievements enable row level security;

create policy "achievements_select_authenticated" on public.achievements
  for select to authenticated using (true);

comment on table public.achievements is
  'Catalogo fijo de logros del sistema (v1, sembrado por migracion). Ver openspec/changes/sistema-logros-perfil design.md decision 1.';

insert into public.achievements (id, scope, title, description) values
  ('pickem_primer_pick', 'pickem', 'Primer Pick', 'Registra tu primer pick en el Pickem Semanal.'),
  ('pickem_semana_perfecta', 'pickem', 'Semana Perfecta', 'Acierta el 100% de tus picks en una semana con al menos 3 partidos.'),
  ('pickem_racha_5', 'pickem', 'Racha de 5', 'Acierta 5 picks consecutivos en el Pickem Semanal.'),
  ('pickem_lider_semana', 'pickem', 'Lider de la Semana', 'Termina en el primer puesto de la tabla de posiciones semanal de tu grupo.'),
  ('survivor_temporada_regular', 'survivor', 'Sobreviviente Regular', 'Llega vivo al final de la temporada regular en Survivor.'),
  ('survivor_podio', 'survivor', 'Podio Survivor', 'Termina en el podio (1, 2 o 3 lugar) de Survivor.'),
  ('survivor_vida_intacta', 'survivor', 'Vida Intacta', 'Sobrevive sin usar ninguna vida extra en Survivor.'),
  ('doble_jugador', 'general', 'Doble Jugador', 'Participa activamente en Pickem Semanal y Survivor dentro del mismo grupo.')
on conflict (id) do nothing;
