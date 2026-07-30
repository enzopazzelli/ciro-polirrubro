-- ============================================================
-- confirmar_venta: escribe una venta completa en una sola
-- transacción (sección "Qué escribe una venta confirmada" de la
-- Etapa 5). SECURITY INVOKER a propósito: corre con los permisos
-- de quien llama, así que toda la RLS de la sección 6 sigue
-- aplicando adentro (usuario_id = auth.uid(), operador limitado a
-- tipo='venta' en movimientos_stock, etc.) sin tener que duplicar
-- esa lógica acá.
--
-- Los triggers de la Etapa 1 hacen el resto solos, dentro de la
-- misma transacción:
--   - movimientos_stock_aplicar(): rechaza si algún producto queda
--     negativo → toda la venta se cae.
--   - venta_pagos_validar_suma() (DEFERRABLE): rechaza si la suma
--     de venta_pagos no cierra contra el total → toda la venta se
--     cae, incluso habiendo pasado el resto de los inserts.
--
-- Idempotente por diseño (sección 4.2): si p_venta_id ya existe, no
-- hace nada. Así, un reintento de la outbox tras perder la
-- respuesta del servidor no duplica nada.
-- ============================================================
create or replace function public.confirmar_venta(
  p_venta_id uuid,
  p_cliente_id uuid,
  p_caja_id uuid,
  p_total int,
  p_creado_en_local timestamptz,
  p_dispositivo_id text,
  p_items jsonb,
  p_pagos jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item jsonb;
  v_pago jsonb;
begin
  if exists (select 1 from public.ventas where id = p_venta_id) then
    return;
  end if;

  insert into public.ventas (id, cliente_id, usuario_id, total, caja_id, creado_en_local, dispositivo_id)
  values (p_venta_id, p_cliente_id, auth.uid(), p_total, p_caja_id, p_creado_en_local, p_dispositivo_id);

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.venta_items (venta_id, producto_id, cantidad, precio_unitario, subtotal)
    values (
      p_venta_id,
      (v_item->>'producto_id')::uuid,
      (v_item->>'cantidad')::int,
      (v_item->>'precio_unitario')::int,
      (v_item->>'subtotal')::int
    );

    insert into public.movimientos_stock (producto_id, cantidad, tipo, referencia_id, usuario_id)
    values (
      (v_item->>'producto_id')::uuid,
      -(v_item->>'cantidad')::int,
      'venta',
      p_venta_id,
      auth.uid()
    );
  end loop;

  for v_pago in select * from jsonb_array_elements(p_pagos)
  loop
    insert into public.venta_pagos (venta_id, forma_pago, monto, monto_recibido)
    values (
      p_venta_id,
      v_pago->>'forma_pago',
      (v_pago->>'monto')::int,
      (v_pago->>'monto_recibido')::int
    );

    if v_pago->>'forma_pago' = 'credito' then
      if p_cliente_id is null then
        raise exception 'Una venta con línea de crédito exige un cliente';
      end if;

      insert into public.movimientos_cuenta (cliente_id, monto, tipo, venta_id, usuario_id)
      values (p_cliente_id, (v_pago->>'monto')::int, 'cargo', p_venta_id, auth.uid());
    end if;

    if v_pago->>'forma_pago' = 'efectivo' and p_caja_id is not null then
      insert into public.movimientos_caja (caja_id, tipo, concepto, monto, venta_id, usuario_id)
      values (p_caja_id, 'ingreso', 'Venta', (v_pago->>'monto')::int, p_venta_id, auth.uid());
    end if;
  end loop;
end;
$$;

revoke all on function public.confirmar_venta(uuid, uuid, uuid, int, timestamptz, text, jsonb, jsonb) from public;
grant execute on function public.confirmar_venta(uuid, uuid, uuid, int, timestamptz, text, jsonb, jsonb) to authenticated;

-- ============================================================
-- Límite de crédito: es un permiso (bloquea operador, deja pasar
-- admin), así que va en RLS y no en la función de arriba. Antes,
-- movimientos_cuenta_insert dejaba pasar cualquier 'cargo' de
-- operador; ahora exige que el saldo resultante no supere
-- limite_credito, salvo que sea admin.
-- ============================================================
drop policy movimientos_cuenta_insert on public.movimientos_cuenta;

create policy movimientos_cuenta_insert on public.movimientos_cuenta
  for insert
  with check (
    usuario_id = auth.uid()
    and (
      public.auth_rol() = 'admin'
      or (
        public.auth_rol() = 'operador'
        and tipo in ('cargo', 'pago')
        and (
          tipo <> 'cargo'
          or (
            select saldo from public.clientes where id = movimientos_cuenta.cliente_id
          ) + monto <= (
            select limite_credito from public.clientes where id = movimientos_cuenta.cliente_id
          )
        )
      )
    )
  );
