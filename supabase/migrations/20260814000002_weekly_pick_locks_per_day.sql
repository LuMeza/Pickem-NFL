-- Cambio de criterio (feedback de producto, otra vez): en vez de dos
-- bloques ("entre semana" / "fin de semana", ver
-- 20260812000003_weekly_pick_locks_by_day_block.sql), cada DIA cierra por
-- separado en el kickoff de su propio primer partido — necesario ahora que
-- la pretemporada mete jueves/viernes/sabado/domingo dentro de la misma
-- semana interna, y el bloque "entre semana" cerraba el viernes junto con
-- el jueves aunque el partido del viernes ni hubiera arrancado.
-- Unica excepcion: el lunes se sigue agrupando con el domingo (cierra junto,
-- en el kickoff del primer partido de domingo) — pedido explicito de
-- producto, no un caso general de "dias consecutivos".
--
-- effective_dow colapsa lunes (1) a domingo (0); para cualquier otro dia
-- coincide con el dow real, asi que agrupar por effective_dow reproduce
-- "cada dia por separado, salvo lunes=domingo" sin casos especiales de mas.
-- Si una semana tiene partido de lunes pero no de domingo, el min() solo ve
-- los partidos de lunes (mismo effective_dow) y el lunes cierra con su
-- propio kickoff — no hace falta un fallback aparte.
create or replace function public.weekly_pick_group_deadline(p_week_id uuid, p_kickoff_at timestamptz)
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  with effective_days as (
    select
      g.kickoff_at,
      case extract(dow from g.kickoff_at at time zone 'America/New_York')
        when 1 then 0
        else extract(dow from g.kickoff_at at time zone 'America/New_York')
      end as effective_dow
    from public.games g
    where g.week_id = p_week_id
  ),
  target as (
    select case extract(dow from p_kickoff_at at time zone 'America/New_York')
      when 1 then 0
      else extract(dow from p_kickoff_at at time zone 'America/New_York')
    end as effective_dow
  )
  select min(e.kickoff_at)
  from effective_days e, target t
  where e.effective_dow = t.effective_dow;
$$;

comment on function public.weekly_pick_group_deadline(uuid, timestamptz) is
  'Kickoff mas temprano del dia calendario (America/New_York) al que pertenece p_kickoff_at dentro de p_week_id, salvo lunes que se agrupa con domingo. Cada dia cierra en su propio primer kickoff.';
