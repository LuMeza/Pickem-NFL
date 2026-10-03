-- Títulos/descripciones de logros con acentos y ordinales correctos (se
-- muestran tal cual en la vitrina del perfil).
update public.achievements set title = 'Líder de la Semana' where id = 'pickem_lider_semana';
update public.achievements
  set description = 'Termina en el podio (1.º, 2.º o 3.er lugar) de Survivor.'
  where id = 'survivor_podio';
