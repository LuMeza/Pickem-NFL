-- Change agregar-semana-hof: agrega el tipo de semana 'hof' (Hall of Fame
-- Game), cronologicamente antes de Pre Sem. 1. sort_order=0 no colisiona con
-- las filas ya sembradas (pretemporada ocupa 1-3, ver 20260718090011_weeks.sql).
alter table public.weeks drop constraint if exists weeks_type_check;
alter table public.weeks add constraint weeks_type_check check (type in ('hof', 'pretemporada', 'regular', 'playoffs'));

insert into public.weeks (type, number, sort_order)
values ('hof', 1, 0)
on conflict (sort_order) do nothing;
