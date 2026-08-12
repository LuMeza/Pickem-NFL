-- Cambio de criterio (otra vez) para el cierre de la Pickem Semanal: ya no
-- cierra toda la semana junta en el kickoff del primer partido
-- (20260812000002_fix_weekly_pick_locks_at_week_kickoff.sql). Ahora se
-- divide en dos bloques de dias:
--   - "Entre semana" (cualquier dia que no sea sab/dom/lun -- normalmente
--     miercoles, jueves o viernes): cierra en el kickoff del primer partido
--     de ese bloque.
--   - "Fin de semana" (sabado/domingo/lunes): cierra en el kickoff del
--     primer partido de ese otro bloque (normalmente el partido del
--     sabado).
-- El dia de la semana se calcula en America/New_York (huso horario de la
-- NFL), no en UTC ni en el huso del usuario, para que un Monday Night que
-- cruza medianoche UTC no se clasifique mal como martes. Espejo en cliente:
-- frontend/src/core/rules/weeklyPickGroupDeadline.ts.
create or replace function public.weekly_pick_group_deadline(p_week_id uuid, p_kickoff_at timestamptz)
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  select case
    when extract(dow from p_kickoff_at at time zone 'America/New_York') in (0, 1, 6) then
      (select min(g.kickoff_at) from public.games g
       where g.week_id = p_week_id
         and extract(dow from g.kickoff_at at time zone 'America/New_York') in (0, 1, 6))
    else
      (select min(g.kickoff_at) from public.games g
       where g.week_id = p_week_id
         and extract(dow from g.kickoff_at at time zone 'America/New_York') not in (0, 1, 6))
  end;
$$;

comment on function public.weekly_pick_group_deadline(uuid, timestamptz) is
  'Kickoff mas temprano del bloque de dias (entre semana, o sab/dom/lun) al que pertenece p_kickoff_at dentro de p_week_id. Dia calculado en America/New_York (huso de la NFL).';

create or replace function public.can_pick_game(p_game_id uuid, p_group_id uuid, p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.games g
    join public.weeks w on w.id = g.week_id
    where g.id = p_game_id
      and w.type in ('hof', 'pretemporada', 'regular')
      and now() < public.weekly_pick_group_deadline(g.week_id, g.kickoff_at)
  );
$$;

comment on function public.can_pick_game(uuid, uuid, uuid) is
  'True si p_uid puede registrar/editar una prediccion para p_game_id en p_group_id: semana valida (no playoffs) y todavia no arranco el primer partido del bloque de dias (entre semana o fin de semana) al que pertenece ese partido.';
