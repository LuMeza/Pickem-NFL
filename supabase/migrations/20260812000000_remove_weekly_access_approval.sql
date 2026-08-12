-- Se elimina el flujo de solicitud/aprobacion de acceso semanal a la Pickem
-- Semanal: el cobro ya se gestiona fuera de la plataforma, asi que la
-- aprobacion del admin dejo de aportar control real y era pura friccion.
-- Cualquier usuario puede registrar sus picks libremente; el unico corte que
-- se conserva es el kickoff del primer partido de la semana
-- (public.week_kickoff_started, que sigue en uso por Survivor).
drop trigger if exists weekly_access_notify_approved on public.weekly_access;
drop function if exists public.notify_weekly_access_approved();

drop table if exists public.weekly_access cascade;

-- can_pick_game ya no exige weekly_access "aprobado": solo semana valida
-- (no playoffs) y partido no iniciado.
create or replace function public.can_pick_game(p_game_id uuid, p_group_id uuid, p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.games g
    join public.weeks w on w.id = g.week_id
    where g.id = p_game_id
      and w.type in ('hof', 'pretemporada', 'regular')
      and now() < g.kickoff_at
  );
$$;

comment on function public.can_pick_game(uuid, uuid, uuid) is
  'True si p_uid puede registrar/editar una prediccion para p_game_id en p_group_id: semana valida (no playoffs) y partido no iniciado.';

-- notify_access_request ya solo aplica a module_access (Survivor, Playoffs);
-- weekly_access dejo de generar solicitudes que notificar.
create or replace function public.notify_access_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_TABLE_NAME <> 'module_access' then
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
    body := jsonb_build_object(
      'source', 'module_access',
      'module', NEW.module,
      'groupId', NEW.group_id,
      'userId', NEW.user_id
    )
  );

  return NEW;
end;
$$;

comment on function public.notify_access_request() is
  'Dispara el correo a platform_admins via la Edge Function notify-access-request cuando se crea una solicitud de acceso a un modulo (Survivor, Playoffs).';
