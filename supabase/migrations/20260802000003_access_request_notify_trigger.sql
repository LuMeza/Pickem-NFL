-- Avisa a los administradores por correo cada vez que alguien solicita
-- acceso a Pickem Semanal (weekly_access), Survivor o Playoffs
-- (module_access). Usa pg_net para invocar la Edge Function
-- notify-access-request de forma asincrona (no bloquea el insert del
-- usuario que solicita), igual que el cron de sync-espn-results
-- (20260802000000_espn_sync_cron.sql) — reutiliza el mismo secreto de Vault
-- "service_role_key", que ya debe existir para que ese cron funcione.
create or replace function public.notify_access_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  if TG_TABLE_NAME = 'module_access' then
    payload := jsonb_build_object(
      'source', 'module_access',
      'module', NEW.module,
      'groupId', NEW.group_id,
      'userId', NEW.user_id
    );
  elsif TG_TABLE_NAME = 'weekly_access' then
    payload := jsonb_build_object(
      'source', 'weekly_access',
      'module', 'quiniela_semanal',
      'groupId', NEW.group_id,
      'userId', NEW.user_id,
      'weekId', NEW.week_id
    );
  else
    return NEW;
  end if;

  perform net.http_post(
    url := 'https://ddxpspoufmdlkbuwbxpe.supabase.co/functions/v1/notify-access-request',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'service_role_key'
        limit 1
      )
    ),
    body := payload
  );

  return NEW;
end;
$$;

comment on function public.notify_access_request() is
  'Dispara el correo a platform_admins via la Edge Function notify-access-request cuando se crea una solicitud de acceso.';

drop trigger if exists module_access_notify_admins on public.module_access;
create trigger module_access_notify_admins
  after insert on public.module_access
  for each row
  when (NEW.status = 'solicitado')
  execute function public.notify_access_request();

drop trigger if exists weekly_access_notify_admins on public.weekly_access;
create trigger weekly_access_notify_admins
  after insert on public.weekly_access
  for each row
  when (NEW.status = 'solicitado')
  execute function public.notify_access_request();
