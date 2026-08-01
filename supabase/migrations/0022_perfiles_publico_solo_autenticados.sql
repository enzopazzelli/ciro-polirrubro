-- Corrige 0021: la vista perfiles_publico, tal como quedó creada, era
-- legible por el rol anon (sin sesión) porque Supabase otorga SELECT por
-- default sobre objetos nuevos del schema public más allá del grant
-- explícito a "authenticated" — se comprobó consultándola con la clave
-- anon, sin login, y devolvía filas reales. Se agrega el mismo filtro que
-- usan las políticas RLS del resto de las tablas (auth_rol() is not null)
-- directo en la vista, y se revoca el grant a anon por las dudas.
revoke select on public.perfiles_publico from anon;

create or replace view public.perfiles_publico as
select id, nombre
from public.perfiles
where public.auth_rol() is not null;

comment on view public.perfiles_publico is
  'Lectura de nombre de usuario para atribución en historiales (movimientos de '
  'stock/cuenta, ventas). Solo devuelve filas si quien consulta está autenticado '
  'y tiene un perfil activo (auth_rol() is not null) — sin esto, era legible por '
  'el rol anon sin sesión. La app debe leer de acá, no de la tabla perfiles, '
  'cuando solo hace falta el nombre de un usuario que no es el propio.';
