-- Avisa por correo al jugador cuando un admin aprueba su solicitud de
-- acceso a una semana de Pickem Semanal (weekly_access.status ->
-- 'aprobado'). Mismo patron que notify_access_request()
-- (20260802000003_access_request_notify_trigger.sql): pg_net async hacia
-- una Edge Function dedicada, reutilizando el secreto de Vault
-- "service_role_key" que ya existe para el resto de los triggers de correo.
create or replace function public.notify_weekly_access_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://ddxpspoufmdlkbuwbxpe.supabase.co/functions/v1/notify-weekly-access-approved',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'service_role_key'
        limit 1
      )
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id,
      'weekId', NEW.week_id
    )
  );

  return NEW;
end;
$$;

comment on function public.notify_weekly_access_approved() is
  'Dispara el correo al jugador via la Edge Function notify-weekly-access-approved cuando un admin aprueba su solicitud de acceso semanal.';

-- "is distinct from" en vez de "= 'solicitado'": cubre tanto la aprobacion
-- normal (solicitado -> aprobado) como si un admin aprueba directo una
-- solicitud que ya habia sido rechazada, sin depender de cual era el
-- estado anterior exacto.
drop trigger if exists weekly_access_notify_approved on public.weekly_access;
create trigger weekly_access_notify_approved
  after update on public.weekly_access
  for each row
  when (NEW.status = 'aprobado' and OLD.status is distinct from 'aprobado')
  execute function public.notify_weekly_access_approved();
