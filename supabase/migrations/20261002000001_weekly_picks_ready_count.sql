-- "Picks de todos" antes del cierre: cuántos jugadores del grupo ya hicieron
-- al menos un pick en la semana, sin revelar qué eligió nadie (los picks
-- ajenos siguen ocultos hasta weekly_picks_board_locked). Mismo universo de
-- jugadores que weekly_picks_board_for_week: sin admins, y sin cuentas de
-- prueba salvo que quien mira sea admin.
create or replace function public.weekly_picks_ready_count(p_group_id uuid, p_week_id uuid)
returns table (ready_count bigint, total_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    count(*) filter (
      where exists (
        select 1
        from public.weekly_picks wp
        join public.games g on g.id = wp.game_id
        where wp.user_id = gm.user_id
          and wp.group_id = gm.group_id
          and g.week_id = p_week_id
      )
    ) as ready_count,
    count(*) as total_count
  from public.group_members gm
  join public.profiles p on p.id = gm.user_id
  where gm.group_id = p_group_id
    and not public.is_platform_admin(p.id)
    and (not p.is_test_account or public.is_platform_admin(auth.uid()))
    and public.can_view_pickem_tables(p_group_id, auth.uid());
$$;

revoke all on function public.weekly_picks_ready_count(uuid, uuid) from public;
grant execute on function public.weekly_picks_ready_count(uuid, uuid) to authenticated;

comment on function public.weekly_picks_ready_count(uuid, uuid) is
  'Cuántos jugadores del grupo ya tienen al menos un pick en la semana (y cuántos hay), para "Picks de todos" antes del cierre. No expone picks.';
