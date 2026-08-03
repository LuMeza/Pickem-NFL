-- Panel admin: agregar/quitar administradores de plataforma desde la UI de
-- Usuarios. Hasta ahora `platform_admins` solo se poblaba a mano desde el SQL
-- editor (ver 20260718090000_platform_admins.sql) y su policy de select solo
-- dejaba a cada usuario ver su propia fila. Para pintar el estado de "Admin"
-- de todos los usuarios en la tabla, los administradores necesitan poder leer
-- la lista completa; el resto de usuarios sigue viendo solo la suya (uso
-- existente: el guard de rutas del panel admin).
drop policy if exists "platform_admins_select_self" on public.platform_admins;

create policy "platform_admins_select_self_or_admin"
  on public.platform_admins
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));

-- Sin policy de insert/delete para authenticated: solo las funciones RPC de
-- abajo (SECURITY DEFINER) escriben en esta tabla, mismo patron que
-- 20260718090007_group_functions_and_rls.sql.

create or replace function public.grant_platform_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Solo un administrador de plataforma puede agregar administradores';
  end if;

  insert into public.platform_admins (user_id) values (p_user_id)
    on conflict (user_id) do nothing;
end;
$$;

create or replace function public.revoke_platform_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Solo un administrador de plataforma puede quitar administradores';
  end if;

  -- Nunca dejar la plataforma sin administradores: sin esta funcion, la unica
  -- forma de recuperarse seria un insert manual desde el SQL editor.
  if (select count(*) from public.platform_admins) <= 1 then
    raise exception 'No se puede quitar al ultimo administrador';
  end if;

  delete from public.platform_admins where user_id = p_user_id;
end;
$$;
