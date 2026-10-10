-- Tareas 1.1-1.3 (espn-game-predictions): pronóstico de victoria por partido,
-- sincronizado desde el "Matchup Predictor" de ESPN (ver Edge Function
-- sync-espn-predictions), con visibilidad configurable por grupo.
--
-- Tabla aparte de games (en vez de columnas nuevas) para que en la fase 2
-- convivan otras fuentes (modelo Elo propio) con su propia fila por partido
-- -- ver design.md decisión 3. No se guardan momios ni proveedor de la línea:
-- solo porcentajes, spread (normalizado al local) y over/under.
create table if not exists public.game_predictions (
  game_id uuid not null references public.games (id) on delete cascade,
  source text not null check (source in ('espn_fpi')),
  home_win_pct numeric(5, 2) not null,
  away_win_pct numeric(5, 2) not null,
  -- Negativo = local favorito (convención de spread respecto al local).
  home_spread numeric(4, 1),
  over_under numeric(4, 1),
  fetched_at timestamptz not null default now(),
  primary key (game_id, source)
);

-- Modo de visibilidad de pronósticos por grupo: off (nadie), after_lock
-- (cada pronóstico se ve cuando cerró el pick de su partido) o always.
-- Sin fila en pickem_settings = off.
alter table public.pickem_settings
  add column if not exists predictions_mode text not null default 'off'
    check (predictions_mode in ('off', 'after_lock', 'always'));

-- SECURITY DEFINER para leer pickem_settings/group_members/games sin
-- depender de sus policies; mismo patrón que can_view_pickem_tables.
-- Si el usuario está en varios grupos con modos distintos gana el más
-- permisivo (design.md decisión 4).
create or replace function public.can_view_game_prediction(p_game_id uuid, p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_platform_admin(p_uid)
    or exists (
      select 1
      from public.group_members gm
      join public.pickem_settings ps on ps.group_id = gm.group_id
      join public.games g on g.id = p_game_id
      where gm.user_id = p_uid
        and (
          ps.predictions_mode = 'always'
          or (
            ps.predictions_mode = 'after_lock'
            and now() >= public.weekly_pick_group_deadline(g.week_id, g.kickoff_at)
          )
        )
    );
$$;

comment on function public.can_view_game_prediction(uuid, uuid) is
  'True si p_uid puede ver el pronóstico del partido: es admin, o pertenece a un grupo con predictions_mode = always, o = after_lock y ya cerró el pick de ese partido (weekly_pick_group_deadline).';

alter table public.game_predictions enable row level security;

-- Solo lectura para usuarios; la escritura la hace la Edge Function con la
-- service role (que se salta RLS), así que no hay policies de escritura.
create policy "game_predictions_select_visible"
  on public.game_predictions
  for select
  to authenticated
  using (public.can_view_game_prediction(game_id, auth.uid()));
