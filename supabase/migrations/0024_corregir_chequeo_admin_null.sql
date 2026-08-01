-- Vulnerabilidad real encontrada y confirmada con una prueba controlada
-- (producto descartable, creado y borrado por este mismo test): un usuario
-- SIN SESIÓN podía llamar a eliminar_producto(p_id) con un id real y
-- borraba el producto, sin ningún error.
--
-- Causa: "public.auth_rol() = 'admin' or ..." — auth_rol() devuelve NULL
-- (no un string) cuando no hay sesión o el perfil no existe/está inactivo.
-- En SQL, "null = 'admin'" es NULL, no false; y en PL/pgSQL,
-- "if not (null or false) then raise exception" NUNCA se ejecuta, porque
-- un IF con condición NULL se trata como false (no entra al bloque) — al
-- revés de una política RLS (donde NULL en el USING/WITH CHECK sí bloquea
-- la fila). Estas cuatro funciones son SECURITY DEFINER o dependen de este
-- chequeo manual, así que el bug sí importa acá (a diferencia de la RLS,
-- que sigue siendo NULL-safe en todos lados).
--
-- Se confirmó con una prueba real (producto de prueba descartable, y una
-- venta de prueba descartable):
--   - eliminar_producto: SÍ se pudo llamar sin sesión y borró el producto.
--   - actualizar_producto / alternar_activo_producto: quedaron bloqueadas
--     en la práctica por el trigger productos_verificar_permisos (que sí
--     usa auth_permiso(), NULL-safe por su propio coalesce), pero el
--     chequeo interno de la función seguía roto — se corrige por las
--     dudas, no depender de que el trigger siga ahí para siempre.
--   - anular_venta: es SECURITY INVOKER y toda la RLS de ventas/venta_items
--     backstopea el problema, pero mismo motivo: se corrige el chequeo.
--
-- Arreglo: "coalesce(auth_rol() = 'admin', false)" en vez de comparar
-- auth_rol() pelado, para que el resultado sea siempre un booleano real
-- y el "or"/"not" de alrededor se comporte como está escrito.

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
  if not (coalesce(public.auth_rol() = 'admin', false) or public.auth_permiso('editar_precio_venta')) then
    raise exception 'No tenés permiso para modificar este producto';
  end if;

  update public.productos
  set nombre = p_nombre,
      marca = p_marca,
      codigo_barras = p_codigo_barras,
      categoria_id = p_categoria_id,
      precio_venta = p_precio_venta,
      precio_costo = case when coalesce(public.auth_rol() = 'admin', false) then p_precio_costo else precio_costo end,
      stock_minimo = p_stock_minimo
  where id = p_id;

  if not found then
    raise exception 'El producto no existe';
  end if;
end;
$$;

create or replace function public.alternar_activo_producto(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (coalesce(public.auth_rol() = 'admin', false) or public.auth_permiso('desactivar')) then
    raise exception 'No tenés permiso para desactivar productos';
  end if;

  update public.productos set activo = not activo where id = p_id;

  if not found then
    raise exception 'El producto no existe';
  end if;
end;
$$;

create or replace function public.eliminar_producto(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (coalesce(public.auth_rol() = 'admin', false) or public.auth_permiso('desactivar')) then
    raise exception 'No tenés permiso para eliminar productos';
  end if;

  delete from public.productos where id = p_id;

  if not found then
    raise exception 'El producto no existe';
  end if;
end;
$$;

create or replace function public.anular_venta(p_venta_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_venta record;
  v_item record;
  v_pago record;
begin
  if not (coalesce(public.auth_rol() = 'admin', false) or public.auth_permiso('anular_ventas')) then
    raise exception 'No tenés permiso para anular ventas';
  end if;

  select * into v_venta from public.ventas where id = p_venta_id;
  if not found then
    raise exception 'La venta no existe';
  end if;
  if v_venta.anulada then
    return;
  end if;

  update public.ventas set anulada = true where id = p_venta_id;

  for v_item in select * from public.venta_items where venta_id = p_venta_id
  loop
    insert into public.movimientos_stock (producto_id, cantidad, tipo, referencia_id, usuario_id, motivo)
    values (v_item.producto_id, v_item.cantidad, 'devolucion', p_venta_id, auth.uid(), 'Anulación de venta');
  end loop;

  for v_pago in select * from public.venta_pagos where venta_id = p_venta_id
  loop
    if v_pago.forma_pago = 'credito' and v_venta.cliente_id is not null then
      insert into public.movimientos_cuenta (cliente_id, monto, tipo, venta_id, usuario_id)
      values (v_venta.cliente_id, -v_pago.monto, 'ajuste', p_venta_id, auth.uid());
    end if;

    if v_pago.forma_pago = 'efectivo' and v_venta.caja_id is not null then
      insert into public.movimientos_caja (caja_id, tipo, concepto, monto, venta_id, usuario_id)
      values (v_venta.caja_id, 'egreso', 'Anulación de venta #' || v_venta.numero, v_pago.monto, p_venta_id, auth.uid());
    end if;
  end loop;
end;
$$;
