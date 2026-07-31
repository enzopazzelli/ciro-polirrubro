-- ============================================================
-- Permisos granulares por operador (roadmap punto 3): la dueña
-- puede habilitar, por confianza y por usuario, algunas de las
-- restricciones que hoy son fijas para el rol "operador". Un solo
-- jsonb en perfiles con claves booleanas — no hace falta una tabla
-- aparte porque son 7 claves fijas, no una lista que crece.
--
-- auth_permiso(clave) es el punto único de verdad: siempre se usa
-- como "auth_rol() = 'admin' or auth_permiso('clave')" — admin
-- nunca depende de este jsonb, solo operador.
--
-- Solo se escribe desde app/api/usuarios/route.ts (service_role,
-- ya protegido por verificarAdmin()); perfiles sigue sin políticas
-- de insert/update/delete para el cliente, así que no hace falta
-- tocar RLS de perfiles acá.
-- ============================================================
alter table public.perfiles
  add column permisos jsonb not null default '{}'::jsonb;

comment on column public.perfiles.permisos is
  'Claves: editar_precio_venta, ver_precio_costo, gestionar_stock, '
  'editar_limite_credito, anular_ventas, exceder_limite_credito, '
  'desactivar. Solo relevante para rol=operador; admin ya tiene todo.';

create or replace function public.auth_permiso(clave text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select (permisos ->> clave)::boolean
      from public.perfiles
      where id = auth.uid()
        and activo = true
    ),
    false
  )
$$;

comment on function public.auth_permiso(text) is
  'true si el usuario autenticado tiene la clave de permiso habilitada '
  'en perfiles.permisos. Se usa siempre junto a auth_rol(): '
  '"auth_rol() = ''admin'' or auth_permiso(''clave'')".';

-- ============================================================
-- productos: editar_precio_venta habilita el UPDATE en general
-- (nombre, marca, código, categoría, precio de venta, stock
-- mínimo). precio_costo sigue siendo exclusivo de admin para
-- ESCRIBIR, siempre — ver_precio_costo solo da lectura (ver la
-- vista productos_lista más abajo), nunca escritura. desactivar
-- habilita el campo activo.
-- ============================================================
drop policy productos_update_admin on public.productos;

create policy productos_update on public.productos
  for update
  using (
    public.auth_rol() = 'admin'
    or public.auth_permiso('editar_precio_venta')
    or public.auth_permiso('desactivar')
  )
  with check (
    public.auth_rol() = 'admin'
    or public.auth_permiso('editar_precio_venta')
    or public.auth_permiso('desactivar')
  );

create or replace function public.productos_verificar_permisos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stock_actual is distinct from old.stock_actual and pg_trigger_depth() <= 1 then
    raise exception 'productos.stock_actual es una caché mantenida por trigger; no se escribe directamente';
  end if;

  if auth.role() = 'service_role' or public.auth_rol() = 'admin' then
    new.actualizado_en := now();
    return new;
  end if;

  if new.precio_costo is distinct from old.precio_costo then
    raise exception 'Solo un administrador puede modificar el precio de costo';
  end if;

  if new.activo is distinct from old.activo and not public.auth_permiso('desactivar') then
    raise exception 'No tenés permiso para desactivar productos';
  end if;

  if (
       new.nombre is distinct from old.nombre
    or new.marca is distinct from old.marca
    or new.codigo_barras is distinct from old.codigo_barras
    or new.categoria_id is distinct from old.categoria_id
    or new.precio_venta is distinct from old.precio_venta
    or new.stock_minimo is distinct from old.stock_minimo
  ) and not public.auth_permiso('editar_precio_venta') then
    raise exception 'No tenés permiso para modificar este producto';
  end if;

  new.actualizado_en := now();
  return new;
end;
$$;

-- ver_precio_costo se suma al enmascarado; mismo orden de columnas
-- que 0015 (CREATE OR REPLACE VIEW no permite reordenar).
create or replace view public.productos_lista as
select
  id,
  nombre,
  codigo_barras,
  categoria_id,
  precio_venta,
  case
    when public.auth_rol() = 'admin' or public.auth_permiso('ver_precio_costo') then precio_costo
    else null
  end as precio_costo,
  stock_actual,
  stock_minimo,
  activo,
  creado_en,
  actualizado_en,
  marca
from public.productos;

-- ============================================================
-- movimientos_stock: gestionar_stock habilita ingreso/ajuste
-- (venta ya estaba habilitado para cualquier operador). Se suma
-- 'devolucion' con anular_ventas: es el tipo que inserta
-- anular_venta() al revertir stock, y esa función corre con
-- security invoker — sin esto, un operador con anular_ventas no
-- podría completar la anulación.
-- ============================================================
drop policy movimientos_stock_insert on public.movimientos_stock;

create policy movimientos_stock_insert on public.movimientos_stock
  for insert
  with check (
    usuario_id = auth.uid()
    and (
      public.auth_rol() = 'admin'
      or (public.auth_rol() = 'operador' and tipo = 'venta')
      or (
        public.auth_rol() = 'operador'
        and tipo in ('ingreso', 'ajuste')
        and public.auth_permiso('gestionar_stock')
      )
      or (
        public.auth_rol() = 'operador'
        and tipo = 'devolucion'
        and public.auth_permiso('anular_ventas')
      )
    )
  );

-- ============================================================
-- clientes: editar_limite_credito y desactivar reemplazan el
-- admin-only fijo que tenía cada uno.
-- ============================================================
create or replace function public.clientes_verificar_permisos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.saldo is distinct from old.saldo and pg_trigger_depth() <= 1 then
    raise exception 'clientes.saldo es una caché mantenida por trigger; no se escribe directamente';
  end if;

  if auth.role() = 'service_role' or public.auth_rol() = 'admin' then
    return new;
  end if;

  if new.limite_credito is distinct from old.limite_credito and not public.auth_permiso('editar_limite_credito') then
    raise exception 'Solo un administrador puede modificar el límite de crédito';
  end if;

  if new.activo is distinct from old.activo and not public.auth_permiso('desactivar') then
    raise exception 'No tenés permiso para desactivar clientes';
  end if;

  return new;
end;
$$;

-- ============================================================
-- movimientos_cuenta: exceder_limite_credito deja pasar un cargo
-- que supera el límite (igual que ya podía hacer admin). Se suma
-- 'ajuste' con anular_ventas: es el tipo que usa anular_venta()
-- para revertir un pago a crédito, por el mismo motivo que arriba.
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
          or public.auth_permiso('exceder_limite_credito')
          or (
            select saldo from public.clientes where id = movimientos_cuenta.cliente_id
          ) + monto <= (
            select limite_credito from public.clientes where id = movimientos_cuenta.cliente_id
          )
        )
      )
      or (
        public.auth_rol() = 'operador'
        and tipo = 'ajuste'
        and public.auth_permiso('anular_ventas')
      )
    )
  );

-- ============================================================
-- ventas: anular_venta() hace "update ventas set anulada = true"
-- corriendo con los permisos de quien llama (security invoker) —
-- sin relajar esta política, un operador con anular_ventas no
-- podría completar la anulación.
-- ============================================================
drop policy ventas_update_admin on public.ventas;

create policy ventas_update on public.ventas
  for update
  using (public.auth_rol() = 'admin' or public.auth_permiso('anular_ventas'))
  with check (public.auth_rol() = 'admin' or public.auth_permiso('anular_ventas'));

-- ============================================================
-- anular_venta: anular_ventas reemplaza el admin-only fijo.
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
  if public.auth_rol() <> 'admin' and not public.auth_permiso('anular_ventas') then
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
