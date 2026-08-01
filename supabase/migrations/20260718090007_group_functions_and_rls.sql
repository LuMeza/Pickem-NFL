-- Tareas 3.3 y 3.4 (base-plataforma): funciones RPC SECURITY DEFINER para
-- crear grupo, regenerar codigo y unirse por codigo; y RLS de group_invites.
-- Ver design.md decision 5.

alter table public.group_invites enable row level security;

create policy "group_invites_select_admin_only"
  on public.group_invites
  for select
  to authenticated
  using (public.is_platform_admin(auth.uid()));

-- Sin policy de insert/update para authenticated: solo las funciones RPC de
-- abajo (SECURITY DEFINER) escriben en esta tabla.

create or replace function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$$;

create or replace function public.create_group(group_name text)
returns table (group_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group_id uuid;
  new_code text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Solo un administrador de plataforma puede crear grupos';
  end if;

  insert into public.groups (name) values (group_name) returning id into new_group_id;

  new_code := public.generate_invite_code();
  insert into public.group_invites (group_id, code, is_active)
    values (new_group_id, new_code, true);

  return query select new_group_id, new_code;
end;
$$;

create or replace function public.regenerate_invite_code(p_group_id uuid)
returns table (code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Solo un administrador de plataforma puede regenerar el codigo de invitacion';
  end if;

  update public.group_invites
    set is_active = false
    where group_id = p_group_id and is_active;

  new_code := public.generate_invite_code();
  insert into public.group_invites (group_id, code, is_active)
    values (p_group_id, new_code, true);

  return query select new_code;
end;
$$;

create or replace function public.join_group_by_code(p_code text)
returns table (group_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
begin
  select gi.group_id into target_group_id
  from public.group_invites gi
  where gi.code = p_code and gi.is_active
  limit 1;

  if target_group_id is null then
    raise exception 'Codigo de invitacion invalido o revocado';
  end if;

  insert into public.group_members (group_id, user_id)
    values (target_group_id, auth.uid())
    on conflict (group_id, user_id) do nothing;

  return query select target_group_id;
end;
$$;
