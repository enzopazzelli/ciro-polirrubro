-- ============================================================
-- RLS: habilitar en todas las tablas. Sin política para una
-- operación = esa operación queda denegada por default para
-- anon/authenticated. service_role bypassea RLS por completo
-- (rol con BYPASSRLS en Supabase), así que el Route Handler de
-- usuarios y los scripts administrativos no se ven afectados.
-- ============================================================
alter table public.perfiles           enable row level security;
alter table public.categorias         enable row level security;
alter table public.productos          enable row level security;
alter table public.movimientos_stock  enable row level security;
alter table public.clientes           enable row level security;
alter table public.movimientos_cuenta enable row level security;
alter table public.cajas              enable row level security;
alter table public.ventas             enable row level security;
alter table public.venta_items        enable row level security;
alter table public.venta_pagos        enable row level security;
alter table public.movimientos_caja   enable row level security;

-- ============================================================
-- perfiles
-- Sin políticas de insert/update/delete a propósito: toda
-- escritura de usuarios pasa por app/api/usuarios/route.ts con
-- la service_role key, después de verificar rol admin (sección 6).
-- ============================================================
create policy perfiles_select on public.perfiles
  for select
  using (public.auth_rol() = 'admin' or id = auth.uid());

-- ============================================================
-- categorias
-- Lectura para cualquier usuario activo, escritura solo admin.
-- ============================================================
create policy categorias_select on public.categorias
  for select
  using (public.auth_rol() is not null);

create policy categorias_insert on public.categorias
  for insert
  with check (public.auth_rol() = 'admin');

create policy categorias_update on public.categorias
  for update
  using (public.auth_rol() = 'admin')
  with check (public.auth_rol() = 'admin');

create policy categorias_delete on public.categorias
  for delete
  using (public.auth_rol() = 'admin');

-- ============================================================
-- productos
-- La tabla base queda restringida a admin: es la única forma de
-- garantizar que precio_costo nunca sale en una respuesta para
-- operador, sin depender de que el frontend "decida" no pedirlo.
-- La operadora lee a través de la vista productos_lista, que
-- enmascara precio_costo con auth_rol().
-- ============================================================
create policy productos_select_admin on public.productos
  for select
  using (public.auth_rol() = 'admin');

create policy productos_insert on public.productos
  for insert
  with check (
    public.auth_rol() = 'admin'
    or (public.auth_rol() = 'operador' and precio_costo is null)
  );

create policy productos_update_admin on public.productos
  for update
  using (public.auth_rol() = 'admin')
  with check (public.auth_rol() = 'admin');

-- Vista de solo lectura para operador (y para admin, si prefiere
-- usarla). No es "security_invoker": corre con los privilegios de
-- quien la crea, así que puede leer productos aunque la RLS de la
-- tabla base no le dé select directo a operador. auth_rol() sigue
-- resolviendo correctamente al usuario real (auth.uid() no cambia
-- por esto), así que el enmascarado de precio_costo es preciso.
create view public.productos_lista as
select
  id,
  nombre,
  codigo_barras,
  categoria_id,
  precio_venta,
  case when public.auth_rol() = 'admin' then precio_costo else null end as precio_costo,
  stock_actual,
  stock_minimo,
  activo,
  creado_en,
  actualizado_en
from public.productos;

comment on view public.productos_lista is
  'Lectura de productos para ambos roles. precio_costo viene null para operador. '
  'La app debe leer de acá, no de la tabla productos, salvo que sea admin gestionando el catálogo.';

grant select on public.productos_lista to authenticated;

-- ============================================================
-- movimientos_stock (inmutable: sin update/delete)
-- Operador solo puede insertar movimientos de tipo 'venta'.
-- Ingreso, ajuste y devolución quedan para admin.
-- ============================================================
create policy movimientos_stock_select on public.movimientos_stock
  for select
  using (public.auth_rol() is not null);

create policy movimientos_stock_insert on public.movimientos_stock
  for insert
  with check (
    usuario_id = auth.uid()
    and (
      public.auth_rol() = 'admin'
      or (public.auth_rol() = 'operador' and tipo = 'venta')
    )
  );

-- ============================================================
-- clientes
-- Ambos roles pueden leer, crear y editar datos básicos. El
-- trigger clientes_verificar_permisos (0008) bloquea que operador
-- toque limite_credito o activo, y que cualquiera escriba saldo
-- directamente.
-- ============================================================
create policy clientes_select on public.clientes
  for select
  using (public.auth_rol() is not null);

create policy clientes_insert on public.clientes
  for insert
  with check (public.auth_rol() is not null);

create policy clientes_update on public.clientes
  for update
  using (public.auth_rol() is not null)
  with check (public.auth_rol() is not null);

-- ============================================================
-- movimientos_cuenta (inmutable: sin update/delete)
-- Ajustes manuales de cuenta quedan para admin; cargo y pago los
-- puede generar cualquiera de los dos roles.
-- ============================================================
create policy movimientos_cuenta_select on public.movimientos_cuenta
  for select
  using (public.auth_rol() is not null);

create policy movimientos_cuenta_insert on public.movimientos_cuenta
  for insert
  with check (
    usuario_id = auth.uid()
    and (
      public.auth_rol() = 'admin'
      or (public.auth_rol() = 'operador' and tipo in ('cargo', 'pago'))
    )
  );

-- ============================================================
-- cajas
-- Base para Etapa 7. La regla de "no abrir una caja si ya hay
-- otra abierta" y "una caja cerrada no se modifica" se agregan
-- como triggers cuando se construya esa etapa, no acá.
-- ============================================================
create policy cajas_select on public.cajas
  for select
  using (public.auth_rol() is not null);

create policy cajas_insert on public.cajas
  for insert
  with check (public.auth_rol() is not null and usuario_apertura_id = auth.uid());

create policy cajas_update on public.cajas
  for update
  using (public.auth_rol() is not null)
  with check (public.auth_rol() is not null);

-- ============================================================
-- ventas
-- Ambos roles venden. Solo admin anula (es el único campo que se
-- modifica después de creada la venta).
-- ============================================================
create policy ventas_select on public.ventas
  for select
  using (public.auth_rol() is not null);

create policy ventas_insert on public.ventas
  for insert
  with check (public.auth_rol() is not null and usuario_id = auth.uid());

create policy ventas_update_admin on public.ventas
  for update
  using (public.auth_rol() = 'admin')
  with check (public.auth_rol() = 'admin');

-- ============================================================
-- venta_items (sin update/delete: inmutables una vez confirmada la venta)
-- ============================================================
create policy venta_items_select on public.venta_items
  for select
  using (public.auth_rol() is not null);

create policy venta_items_insert on public.venta_items
  for insert
  with check (public.auth_rol() is not null);

-- ============================================================
-- venta_pagos (sin update/delete expuesto a los roles de la app)
-- ============================================================
create policy venta_pagos_select on public.venta_pagos
  for select
  using (public.auth_rol() is not null);

create policy venta_pagos_insert on public.venta_pagos
  for insert
  with check (public.auth_rol() is not null);

-- ============================================================
-- movimientos_caja (inmutable: sin update/delete)
-- ============================================================
create policy movimientos_caja_select on public.movimientos_caja
  for select
  using (public.auth_rol() is not null);

create policy movimientos_caja_insert on public.movimientos_caja
  for insert
  with check (public.auth_rol() is not null and usuario_id = auth.uid());
