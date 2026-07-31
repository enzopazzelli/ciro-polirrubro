-- ============================================================
-- anular_venta: revierte una venta completa en una sola
-- transacción. El permiso ("la dueña puede anular ventas") ya
-- existía desde la Etapa 1 en la sección 6 y en la política
-- ventas_update_admin; lo que faltaba era la reversión real de
-- stock, cuenta corriente y caja — poner anulada=true sin revertir
-- esto dejaría todo desincronizado.
--
-- SECURITY INVOKER a propósito, igual que confirmar_venta(): corre
-- con los permisos de quien llama, así que la RLS de cada tabla
-- sigue aplicando. El chequeo de admin es explícito, para dar un
-- mensaje claro en vez de un error genérico de RLS.
--
-- Idempotente: si la venta ya estaba anulada, no hace nada.
-- ============================================================
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
  if public.auth_rol() <> 'admin' then
    raise exception 'Solo un administrador puede anular una venta';
  end if;

  select * into v_venta from public.ventas where id = p_venta_id;

  if not found then
    raise exception 'La venta no existe';
  end if;

  if v_venta.anulada then
    return;
  end if;

  update public.ventas set anulada = true where id = p_venta_id;

  -- Devuelve el stock vendido.
  for v_item in select * from public.venta_items where venta_id = p_venta_id
  loop
    insert into public.movimientos_stock (producto_id, cantidad, tipo, referencia_id, usuario_id, motivo)
    values (v_item.producto_id, v_item.cantidad, 'devolucion', p_venta_id, auth.uid(), 'Anulación de venta');
  end loop;

  -- Revierte cuenta corriente (si había línea a crédito) y caja (si había línea en efectivo).
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

revoke all on function public.anular_venta(uuid) from public;
grant execute on function public.anular_venta(uuid) to authenticated;
