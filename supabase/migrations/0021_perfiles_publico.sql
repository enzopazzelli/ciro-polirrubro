-- Vista de solo lectura con datos mínimos de perfiles (id + nombre), para
-- que cualquier usuario autenticado pueda ver quién hizo un movimiento o
-- una venta en un historial, sin depender de la política perfiles_select
-- (0009: "admin o uno mismo"), que existe para no filtrar rol/permisos de
-- otros usuarios pero de paso deja sin nombre a un operador viendo el
-- historial de alguien más. Mismo patrón que productos_lista (0009): la
-- vista corre con los privilegios de quien la crea (no es
-- security_invoker), así que puede leer perfiles aunque la RLS de la
-- tabla base no le dé select directo al usuario que consulta.
create view public.perfiles_publico as
select id, nombre
from public.perfiles;

comment on view public.perfiles_publico is
  'Lectura de nombre de usuario para atribución en historiales (movimientos de '
  'stock/cuenta, ventas). La app debe leer de acá, no de la tabla perfiles, '
  'cuando solo hace falta el nombre de un usuario que no es el propio.';

grant select on public.perfiles_publico to authenticated;
