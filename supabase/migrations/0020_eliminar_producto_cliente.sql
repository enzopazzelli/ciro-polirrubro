-- ============================================================
-- Eliminar productos/clientes (no solo desactivar), a pedido de la
-- clienta tras probar la app. Mismo permiso que desactivar — es la
-- misma franja de confianza, y así no se suma una octava clave de
-- permisos por algo tan cercano a lo que ya existía.
--
-- Si el producto/cliente tiene historial (venta_items, movimientos_
-- stock, movimientos_cuenta), el DELETE simplemente falla con una
-- violación de FK (23503) — mensajeAmigable() ya la traduce. No hace
-- falta chequear el historial a mano: la base ya protege sola.
--
-- productos: igual que actualizar_producto/alternar_activo_producto
-- (0018) — el SELECT de la tabla base sigue siendo admin-only, así
-- que sin esta función un DELETE de operador afectaría 0 filas en
-- silencio en vez de fallar con un error claro.
-- ============================================================
create or replace function public.eliminar_producto(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.auth_rol() = 'admin' or public.auth_permiso('desactivar')) then
    raise exception 'No tenés permiso para eliminar productos';
  end if;

  delete from public.productos where id = p_id;

  if not found then
    raise exception 'El producto no existe';
  end if;
end;
$$;

revoke all on function public.eliminar_producto(uuid) from public;
grant execute on function public.eliminar_producto(uuid) to authenticated;

-- clientes: clientes_select ya es abierto a ambos roles, así que acá
-- alcanza con una policy de RLS directa, sin necesidad de función.
create policy clientes_delete on public.clientes
  for delete
  using (public.auth_rol() = 'admin' or public.auth_permiso('desactivar'));
