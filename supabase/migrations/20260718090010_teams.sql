-- Tarea 2.7 (base-plataforma): catalogo de los 32 equipos de la NFL.
-- id = abreviatura estandar de 2-3 letras (mas legible que un uuid en el catalogo).
create table if not exists public.teams (
  id text primary key,
  name text not null
);

insert into public.teams (id, name) values
  ('ARI', 'Arizona Cardinals'),
  ('ATL', 'Atlanta Falcons'),
  ('BAL', 'Baltimore Ravens'),
  ('BUF', 'Buffalo Bills'),
  ('CAR', 'Carolina Panthers'),
  ('CHI', 'Chicago Bears'),
  ('CIN', 'Cincinnati Bengals'),
  ('CLE', 'Cleveland Browns'),
  ('DAL', 'Dallas Cowboys'),
  ('DEN', 'Denver Broncos'),
  ('DET', 'Detroit Lions'),
  ('GB', 'Green Bay Packers'),
  ('HOU', 'Houston Texans'),
  ('IND', 'Indianapolis Colts'),
  ('JAX', 'Jacksonville Jaguars'),
  ('KC', 'Kansas City Chiefs'),
  ('LAC', 'Los Angeles Chargers'),
  ('LAR', 'Los Angeles Rams'),
  ('LV', 'Las Vegas Raiders'),
  ('MIA', 'Miami Dolphins'),
  ('MIN', 'Minnesota Vikings'),
  ('NE', 'New England Patriots'),
  ('NO', 'New Orleans Saints'),
  ('NYG', 'New York Giants'),
  ('NYJ', 'New York Jets'),
  ('PHI', 'Philadelphia Eagles'),
  ('PIT', 'Pittsburgh Steelers'),
  ('SEA', 'Seattle Seahawks'),
  ('SF', 'San Francisco 49ers'),
  ('TB', 'Tampa Bay Buccaneers'),
  ('TEN', 'Tennessee Titans'),
  ('WAS', 'Washington Commanders')
on conflict (id) do nothing;
