-- admin_survivor_picks_for_week (ver 20260915000001_survivor_withdrawals.sql para la version previa):
-- la vista "Por semana" del panel admin ahora lista solo a quienes seguian en
-- juego en la semana consultada. Antes mostraba a todos los miembros, y en
-- semanas avanzadas eso era una lista larga de eliminados y retirados sin
-- ningun pick que revisar.
--
--  * Se omiten los retirados (el retiro se revierte desde la pestana Pagos,
--    que tiene su propio listado).
--  * Se omiten los eliminados en una semana ANTERIOR a la consultada. Quien
--    fue eliminado justo en la semana consultada si aparece: sus picks de esa
--    semana existen y fue lo que lo saco.
--  * status se reporta "as of" la semana consultada: quien fue eliminado
--    despues sigue figurando como 'alive' en semanas previas a su eliminacion.
--
-- Mismo tipo de retorno que la version previa, por eso basta create or replace.
create or replace function public.admin_survivor_picks_for_week(p_group_id uuid, p_week_id uuid)
returns table (
  user_id uuid,
  display_name text,
  team_id text,
  life_number int,
  status text,
  is_admin boolean,
  is_test_account boolean,
  is_withdrawn boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    gm.user_id,
    p.display_name,
    sp.team_id,
    sp.life_number,
    case
      when ss.status = 'eliminated' and we.sort_order is not null and we.sort_order <= wsel.sort_order
        then 'eliminated'
      when ss.status = 'eliminated'
        then 'alive'
      else coalesce(ss.status, 'alive')
    end as status,
    public.is_platform_admin(gm.user_id) as is_admin,
    p.is_test_account,
    coalesce(sw.withdrawn, false) as is_withdrawn
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  join public.weeks wsel on wsel.id = p_week_id
  left join public.survivor_picks sp
    on sp.user_id = gm.user_id and sp.group_id = gm.group_id and sp.week_id = p_week_id
  left join public.survivor_state ss
    on ss.user_id = gm.user_id and ss.group_id = gm.group_id
  left join public.weeks we on we.id = ss.eliminated_week_id
  left join public.survivor_withdrawals sw
    on sw.group_id = gm.group_id and sw.user_id = gm.user_id
  where gm.group_id = p_group_id
    and public.is_platform_admin(auth.uid())
    and not coalesce(sw.withdrawn, false)
    and not (ss.status = 'eliminated' and we.sort_order is not null and we.sort_order < wsel.sort_order)
  order by p.display_name;
$$;

comment on function public.admin_survivor_picks_for_week(uuid, uuid) is
  'Panel admin: pick de survivor de esa semana (o null) y estado a esa semana, solo para quienes seguian en juego en ella (excluye retirados y eliminados en semanas anteriores). Incluye flags is_admin/is_test_account/is_withdrawn. Vacio si el llamante no es platform_admin.';
