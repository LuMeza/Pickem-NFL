-- Decision de producto: se descarta el logro "veterano" (evaluado de forma
-- perezosa por antiguedad de cuenta, ver 20260801000007). Borrar la fila del
-- catalogo tambien limpia, por cascada de FK, cualquier user_achievements ya
-- desbloqueado para ese logro.
delete from public.achievements where id = 'veterano';

-- sync_my_achievements() existia solo para evaluar "veterano" de forma
-- perezosa al consultar el perfil (no hay otro logro general sin trigger
-- propio) — sin logro que evaluar, la funcion queda sin uso.
drop function if exists public.sync_my_achievements();
