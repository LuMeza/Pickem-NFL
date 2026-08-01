-- Funciones auxiliares SECURITY DEFINER usadas por las policies de RLS de las
-- demas tablas (seccion 3). Se marcan SECURITY DEFINER para poder leer
-- platform_admins/group_members sin quedar atrapadas en su propia RLS ni
-- provocar recursion en las policies que las invocan.

create or replace function public.is_platform_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.platform_admins pa where pa.user_id = uid
  );
$$;

comment on function public.is_platform_admin(uuid) is
  'True si uid pertenece a platform_admins. Usada por las policies de RLS de todas las tablas.';
