-- Permite que un usuario reenvie su propia solicitud de acceso semanal
-- despues de un rechazo (p.ej. el admin rechazo por error), sin depender
-- del admin, siempre y cuando la semana todavia no haya iniciado. Antes,
-- el reenvio (upsert -> UPDATE por la PK ya existente) solo lo permitia la
-- policy "weekly_access_update_admin_only" y fallaba para usuarios comunes.
create policy "weekly_access_update_own_resubmit"
  on public.weekly_access
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and status = 'rechazado'
    and not public.week_kickoff_started(week_id)
  )
  with check (
    auth.uid() = user_id
    and status = 'solicitado'
    and not public.week_kickoff_started(week_id)
  );

-- El trigger de notificacion a admins solo corria en insert; el reenvio
-- ahora es un update (rechazado -> solicitado), asi que necesita su propio
-- trigger para seguir avisando por correo a los admins.
create trigger weekly_access_notify_admins_resubmit
  after update on public.weekly_access
  for each row
  when (NEW.status = 'solicitado' and OLD.status = 'rechazado')
  execute function public.notify_access_request();
