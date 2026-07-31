-- ============================================================
-- Cierra un hueco que 0016 dejó sin ver: productos_select_admin
-- (0009) restringe el SELECT de la tabla base a admin — a
-- propósito, para que precio_costo nunca salga fuera de la vista
-- productos_lista. Postgres necesita poder "ver" una fila para
-- poder actualizarla (además de que la política de UPDATE la deje
-- pasar), así que un UPDATE directo de operador contra la tabla
-- base afecta 0 filas en silencio, sin error — ni el ajuste de
-- precio ni el desactivar producto llegaban a aplicarse.
--
-- Solución: dos funciones security definer, mismo patrón que
-- confirmar_venta/anular_venta — corren con permisos de dueño de
-- tabla (bypasean el SELECT admin-only) pero validan el permiso a
-- mano adentro. precio_costo queda protegido igual: si quien llama
-- no es admin, el UPDATE simplemente no lo toca, sin importar qué
-- mande el cliente.
-- ============================================================
create or replace function public.actualizar_producto(
  p_id uuid,
  p_nombre text,
  p_marca text,
  p_codigo_barras text,
  p_categoria_id uuid,
  p_precio_venta int,
  p_precio_costo int,
  p_stock_minimo int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.auth_rol() = 'admin' or public.auth_permiso('editar_precio_venta')) then
    raise exception 'No tenés permiso para modificar este producto';
  end if;

  update public.productos
  set nombre = p_nombre,
      marca = p_marca,
      codigo_barras = p_codigo_barras,
      categoria_id = p_categoria_id,
      precio_venta = p_precio_venta,
      precio_costo = case when public.auth_rol() = 'admin' then p_precio_costo else precio_costo end,
      stock_minimo = p_stock_minimo
  where id = p_id;

  if not found then
    raise exception 'El producto no existe';
  end if;
end;
$$;

revoke all on function public.actualizar_producto(uuid, text, text, text, uuid, int, int, int) from public;
grant execute on function public.actualizar_producto(uuid, text, text, text, uuid, int, int, int) to authenticated;

create or replace function public.alternar_activo_producto(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.auth_rol() = 'admin' or public.auth_permiso('desactivar')) then
    raise exception 'No tenés permiso para desactivar productos';
  end if;

  update public.productos set activo = not activo where id = p_id;

  if not found then
    raise exception 'El producto no existe';
  end if;
end;
$$;

revoke all on function public.alternar_activo_producto(uuid) from public;
grant execute on function public.alternar_activo_producto(uuid) to authenticated;
