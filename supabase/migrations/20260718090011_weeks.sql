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
