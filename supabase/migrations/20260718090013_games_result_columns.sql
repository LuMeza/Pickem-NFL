-- Tarea 2.10 (base-plataforma): resultado oficial del partido. outcome/scores
-- nullable mientras no se haya jugado o cargado; result_source distingue
-- carga manual de una futura sincronizacion automatica (ver design.md,
-- Open Questions, y specs/carga-resultados).
alter table public.games
  add column if not exists outcome text check (outcome in ('home', 'away', 'tie')),
  add column if not exists home_score int,
  add column if not exists away_score int,
  add column if not exists result_source text check (result_source in ('manual', 'auto_sync'));

-- Precedencia permanente de la carga manual (specs/carga-resultados,
-- Requirement "Origen del resultado y precedencia de la carga manual"):
-- una escritura con result_source = 'auto_sync' nunca puede sobreescribir un
-- resultado marcado como 'manual'. La sincronizacion automatica en si se
-- implementa en un change aparte (integracion-resultados-espn); esta funcion
-- protege el dato desde ahora sin importar quien escriba despues.
create or replace function public.enforce_manual_result_precedence()
returns trigger
language plpgsql
as $$
begin
  if old.result_source = 'manual' and new.result_source = 'auto_sync' then
    new.outcome := old.outcome;
    new.home_score := old.home_score;
    new.away_score := old.away_score;
    new.result_source := old.result_source;
  end if;
  return new;
end;
$$;

drop trigger if exists games_manual_precedence on public.games;
create trigger games_manual_precedence
  before update on public.games
  for each row
  execute function public.enforce_manual_result_precedence();
