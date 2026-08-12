-- Designación semanal de lesión (Questionable/Doubtful/Out), sincronizada
-- desde el reporte de lesiones de ESPN (ver sync-espn-roster) — complementa
-- la columna `status` ya existente, que solo refleja el estado de "roster"
-- de largo plazo (Active/Injured Reserve/PUP/Suspended/Practice Squad) y no
-- cambia semana a semana.
alter table public.players
  add column if not exists injury_status text,
  add column if not exists injury_detail text;
