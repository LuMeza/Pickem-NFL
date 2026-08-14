-- Habilita Supabase Realtime sobre games para que el frontend pueda avisar
-- "hay resultados nuevos" sin polling (ver ResultsUpdatedBanner). replica
-- identity full es necesario para que el payload de UPDATE incluya los
-- valores previos de las columnas (old_record) — sin esto solo trae la PK,
-- y el cliente no puede distinguir un cambio real de outcome de cualquier
-- otro update (ej. live_period cada 15 min, que NO debe disparar el aviso).
alter table public.games replica identity full;

alter publication supabase_realtime add table public.games;
