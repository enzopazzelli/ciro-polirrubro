-- ============================================================
-- auth_rol(): rol del usuario autenticado, o null si no tiene
-- perfil activo. SECURITY DEFINER para poder leer perfiles sin
-- pasar por su propia RLS (evita recursión) y para que las
-- políticas RLS de otras tablas no paguen el costo de una
-- subconsulta cada vez. STABLE porque no cambia dentro de una
-- misma transacción.
-- ============================================================
create or replace function public.auth_rol()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select rol
  from public.perfiles
  where id = auth.uid()
    and activo = true
$$;

comment on function public.auth_rol() is
  'Rol del usuario autenticado (admin/operador), o null si no existe '
  'o está desactivado. Un usuario desactivado pierde acceso a los '
  'datos de inmediato aunque su JWT siga siendo válido.';

-- ============================================================
-- productos: la app nunca escribe stock_actual directamente,
-- solo el trigger de movimientos_stock lo hace. pg_trigger_depth()
-- distingue un UPDATE directo del cliente (profundidad 1) de la
-- escritura en cascada que hace este mismo trigger (profundidad 2+).
-- ============================================================
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

  new.actualizado_en := now();
  return new;
end;
$$;

create trigger trg_productos_verificar_permisos
  before update on public.productos
  for each row execute function public.productos_verificar_permisos();

-- ============================================================
-- movimientos_stock: valida que el movimiento no deje stock
-- negativo y aplica el delta a productos.stock_actual, todo en
-- un único UPDATE atómico (Postgres serializa automáticamente
-- los UPDATE concurrentes sobre la misma fila).
-- ============================================================
create or replace function public.movimientos_stock_aplicar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  stock_resultante int;
begin
  update public.productos
  set stock_actual = stock_actual + new.cantidad
  where id = new.producto_id
  returning stock_actual into stock_resultante;

  if not found then
    raise exception 'El producto % no existe', new.producto_id;
  end if;

  if stock_resultante < 0 then
    raise exception 'El movimiento dejaría stock negativo (resultado: %)', stock_resultante;
  end if;

  return new;
end;
$$;

create trigger trg_movimientos_stock_aplicar
  before insert on public.movimientos_stock
  for each row execute function public.movimientos_stock_aplicar();

-- ============================================================
-- clientes: mismo patrón que productos para saldo (caché de solo
-- lectura), más el resguardo de que límite de crédito y
-- desactivación son admin-only a nivel de base de datos.
-- auth.role() = 'service_role' deja pasar al Route Handler de
-- usuarios y a scripts administrativos que usan la service_role key.
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

  if new.limite_credito is distinct from old.limite_credito then
    raise exception 'Solo un administrador puede modificar el límite de crédito';
  end if;

  if new.activo is distinct from old.activo then
    raise exception 'Solo un administrador puede desactivar un cliente';
  end if;

  return new;
end;
$$;

create trigger trg_clientes_verificar_permisos
  before update on public.clientes
  for each row execute function public.clientes_verificar_permisos();

-- ============================================================
-- movimientos_cuenta: aplica el delta a clientes.saldo. Sin piso
-- en cero: un pago mayor a la deuda deja saldo a favor (negativo),
-- y es válido.
-- ============================================================
create or replace function public.movimientos_cuenta_aplicar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clientes
  set saldo = saldo + new.monto
  where id = new.cliente_id;

  if not found then
    raise exception 'El cliente % no existe', new.cliente_id;
  end if;

  return new;
end;
$$;

create trigger trg_movimientos_cuenta_aplicar
  before insert on public.movimientos_cuenta
  for each row execute function public.movimientos_cuenta_aplicar();

-- ============================================================
-- venta_pagos: la suma de monto por venta_id debe cerrar exacto
-- contra ventas.total. Trigger de restricción DEFERRABLE: se
-- evalúa recién al final de la transacción, para no reventar
-- mientras se insertan las líneas una por una.
-- ============================================================
create or replace function public.venta_pagos_validar_suma()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta_id uuid := coalesce(new.venta_id, old.venta_id);
  v_total    int;
  v_suma     int;
begin
  select total into v_total from public.ventas where id = v_venta_id;

  select coalesce(sum(monto), 0) into v_suma
  from public.venta_pagos
  where venta_id = v_venta_id;

  if v_suma <> v_total then
    raise exception
      'La suma de venta_pagos (%) no coincide con ventas.total (%) para la venta %',
      v_suma, v_total, v_venta_id;
  end if;

  return null;
end;
$$;

create constraint trigger trg_venta_pagos_validar_suma
  after insert or update or delete on public.venta_pagos
  deferrable initially deferred
  for each row execute function public.venta_pagos_validar_suma();
