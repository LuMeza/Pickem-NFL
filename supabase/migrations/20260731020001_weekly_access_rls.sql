-- Tarea 1.4 (modulo-quiniela-semanal): usuario ve/crea su propia solicitud;
-- solo platform_admins aprueba/rechaza y ve todas las de un grupo. Tarea 1.3:
-- ni la solicitud ni su resolucion se permiten una vez iniciado el primer
-- partido de la semana (public.week_kickoff_started).
alter table public.weekly_access enable row level security;

create policy "weekly_access_select_own_or_admin"
  on public.weekly_access
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));

create policy "weekly_access_insert_own_request"
  on public.weekly_access
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'solicitado'
    and not public.week_kickoff_started(week_id)
  );

create policy "weekly_access_update_admin_only"
  on public.weekly_access
  for update
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (
    public.is_platform_admin(auth.uid())
    and not public.week_kickoff_started(week_id)
  );
