-- Ficha del jugador (altura, peso, edad, universidad, experiencia, estatus)
-- para el hover/detalle en Equipos > Plantilla. Estos datos ya vienen en el
-- mismo payload del roster de ESPN (site.api.espn.com/.../roster) que
-- sync-espn-roster ya consume — se agregan como columnas en vez de pedirlos
-- jugador por jugador on-demand (mas simple y no depende de una llamada en
-- vivo por cada hover).
--
-- height/weight se guardan en las unidades crudas que manda ESPN (pulgadas,
-- libras) en vez de su string ya formateado ("5' 11\"", "180 lbs") para que
-- el frontend pueda mostrarlas en metrico (m/kg) sin volver a parsear texto.
alter table public.players
  add column if not exists height_in integer,
  add column if not exists weight_lbs integer,
  add column if not exists birth_date date,
  add column if not exists age integer,
  add column if not exists college text,
  add column if not exists experience_years integer,
  add column if not exists status text;
