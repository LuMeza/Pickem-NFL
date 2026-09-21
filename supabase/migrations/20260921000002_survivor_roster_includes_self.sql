-- Bug: un admin que juega Survivor veia "Aun no juegas" en el dashboard (y su
-- propio estado no cargaba en la pagina de Survivor) porque el roster excluye
-- a los admins del listado. Se les sigue ocultando ante los demas jugadores,
-- pero cada admin se ve a si mismo.
drop function if exists public.survivor_group_roster(uuid);

create function public.survivor_group_roster(p_group_id uuid)
returns table (
  user_id uuid,
  display_name text,
  current_life int,
  status text,
  first_loss_week_id uuid,
  eliminated_week_id uuid,
  revival_deadline_week_id uuid,
  final_rank int
)
language sql
security definer
set search_path = public
stable
as $$
  select
    gm.user_id,
    p.display_name,
    coalesce(ss.current_life, 1) as current_life,
    coalesce(ss.status, 'alive') as status,
    ss.first_loss_week_id,
    ss.eliminated_week_id,
    ss.revival_deadline_week_id,
    ss.final_rank
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  left join public.survivor_state ss on ss.group_id = gm.group_id and ss.user_id = gm.user_id
  where gm.group_id = p_group_id
    and (public.is_group_member(p_group_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    and (not public.is_platform_admin(gm.user_id) or gm.user_id = auth.uid())
    and (not p.is_test_account or public.is_platform_admin(auth.uid()))
    and not exists (
      select 1 from public.survivor_withdrawals sw
      where sw.group_id = p_group_id and sw.user_id = gm.user_id and sw.withdrawn
    );
$$;
