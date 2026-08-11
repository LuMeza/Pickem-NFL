-- Bug: un resultado cargado a mano (result_source = 'manual') sin marcador
-- numerico bloqueaba PARA SIEMPRE que la sincronizacion con ESPN completara
-- home_score/away_score, por el trigger games_manual_precedence
-- (20260718090013_games_result_columns.sql), que descartaba cualquier
-- escritura auto_sync entera si el registro ya era manual. El ranking
-- functiona igual (solo usa outcome), pero el calendario nunca mostraba
-- "Final" porque getGameLiveStatus exige home_score/away_score no nulos.
--
-- Fix: en vez de descartar la escritura completa, solo se preserva el valor
-- manual que ya existe (coalesce); los campos que el admin dejo en null se
-- rellenan con lo que traiga ESPN. result_source se mantiene 'manual' para
-- no perder la trazabilidad de que el ganador se cargo a mano.
create or replace function public.enforce_manual_result_precedence()
returns trigger
language plpgsql
as $$
begin
  if old.result_source = 'manual' and new.result_source = 'auto_sync' then
    new.outcome := coalesce(old.outcome, new.outcome);
    new.home_score := coalesce(old.home_score, new.home_score);
    new.away_score := coalesce(old.away_score, new.away_score);
    new.result_source := old.result_source;
  end if;
  return new;
end;
$$;
