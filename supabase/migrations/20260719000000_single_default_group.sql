-- Simplificacion de producto (feedback post-implementacion): un unico grupo
-- global en vez de multiples grupos administrados por invitacion — ver
-- actualizacion de openspec/changes/base-plataforma specs/grupos-privados.
-- No se elimina el modelo generico (groups/group_members siguen siendo
-- tablas normales, sin restriccion estructural a una sola fila), solo se
-- fija una unica fila de grupo y se automatiza la membresia: todo usuario
-- dado de alta por la Edge Function admin-create-user queda agregado a este
-- grupo automaticamente (ver supabase/functions/admin-create-user).

insert into public.groups (name)
select 'Grupo Principal'
where not exists (select 1 from public.groups);

-- Bootstrap: usuarios que ya existian (ej. el primer administrador, dado de
-- alta manualmente antes de esta migracion) quedan agregados al grupo unico.
insert into public.group_members (group_id, user_id)
select g.id, p.id
from public.groups g
cross join public.profiles p
where g.id = (select id from public.groups order by created_at limit 1)
  and not exists (
    select 1 from public.group_members gm where gm.group_id = g.id and gm.user_id = p.id
  );
