-- Tarea 4.5 (modulo-quiniela-semanal): configuracion de visibilidad de las
-- tablas de posiciones para usuarios sin ningun acceso semanal aprobado en la
-- temporada. Una fila por grupo (hoy un unico grupo global); si no hay fila,
-- se asume no visible (default false via coalesce en can_view_quiniela_tables).
create table if not exists public.quiniela_settings (
  group_id uuid primary key references public.groups (id) on delete cascade,
  tables_visible_to_all boolean not null default false
);
