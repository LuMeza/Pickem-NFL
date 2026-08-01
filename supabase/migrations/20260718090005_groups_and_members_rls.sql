-- Tarea 3.2 (base-plataforma): solo miembros (y platform_admins) leen datos de
-- su grupo; solo platform_admins crea grupos y administra miembros.

-- Helper adicional: evita recursion directa de group_members sobre si misma
-- dentro de su propia policy de SELECT.
create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = gid and gm.user_id = uid
  );
$$;

comment on function public.is_group_member(uuid, uuid) is
  'True si uid pertenece al grupo gid. SECURITY DEFINER para no recursar sobre la RLS de group_members.';

alter table public.groups enable row level security;

create policy "groups_select_member_or_admin"
  on public.groups
  for select
  to authenticated
  using (
    public.is_platform_admin(auth.uid())
    or public.is_group_member(id, auth.uid())
  );

-- Sin policy de insert/update/delete para authenticated: la creacion de grupos
-- solo ocurre via la funcion RPC create_group (SECURITY DEFINER, ver
-- migracion group_functions_and_rls), que valida platform_admins internamente.

alter table public.group_members enable row level security;

create policy "group_members_select_member_or_admin"
  on public.group_members
  for select
  to authenticated
  using (
    public.is_platform_admin(auth.uid())
    or public.is_group_member(group_id, auth.uid())
  );

create policy "group_members_delete_admin_only"
  on public.group_members
  for delete
  to authenticated
  using (public.is_platform_admin(auth.uid()));

-- Sin policy de insert: la union a un grupo solo ocurre via la funcion RPC
-- join_group_by_code (SECURITY DEFINER), nunca por insert directo del cliente.
