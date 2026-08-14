-- Cuarto y reloj en vivo de un partido en curso (feedback del dueño del
-- producto: "en que momento van, primer/segundo/tercer/cuarto"). ESPN ya
-- trae esto en cada corrida del scoreboard (status.period/status.displayClock)
-- pero sync-espn-results lo descartaba — solo leia completed/score.
-- Nullable: solo tiene valor mientras status.type.state === 'in'; se limpia
-- solo al terminar el partido (deja de venir "in" en el proximo fetch).
alter table public.games
  add column if not exists live_period smallint,
  add column if not exists live_clock text;
