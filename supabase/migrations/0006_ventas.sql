create table public.ventas (
  id                uuid primary key default gen_random_uuid(),   -- generado en el dispositivo
  numero            bigserial,                    -- correlativo, lo asigna el servidor
  cliente_id        uuid references public.clientes(id),          -- null = consumidor anónimo
  usuario_id        uuid references public.perfiles(id),
  total             int not null,
  caja_id           uuid references public.cajas(id),
  anulada           boolean not null default false,
  creado_en         timestamptz not null default now(),
  creado_en_local   timestamptz,
  dispositivo_id    text
);

create index ventas_cliente_id_idx on public.ventas (cliente_id);
create index ventas_usuario_id_idx on public.ventas (usuario_id);
create index ventas_caja_id_idx on public.ventas (caja_id);
create index ventas_creado_en_idx on public.ventas (creado_en);

-- Ahora que ventas existe, cerramos la FK que quedó pendiente en 0004.
alter table public.movimientos_cuenta
  add constraint movimientos_cuenta_venta_id_fkey
  foreign key (venta_id) references public.ventas(id);

create table public.venta_items (
  id                uuid primary key default gen_random_uuid(),
  venta_id          uuid not null references public.ventas(id),
  producto_id       uuid not null references public.productos(id),
  cantidad          int not null,
  precio_unitario   int not null,                 -- congelado al momento de la venta
  subtotal          int not null
);

create index venta_items_venta_id_idx on public.venta_items (venta_id);
create index venta_items_producto_id_idx on public.venta_items (producto_id);

comment on column public.venta_items.precio_unitario is 'Copiado a propósito: si sube el precio, las ventas viejas no cambian de monto.';

-- Una venta puede cobrarse con más de una forma de pago.
create table public.venta_pagos (
  id                uuid primary key default gen_random_uuid(),
  venta_id          uuid not null references public.ventas(id),
  forma_pago        text not null check (forma_pago in ('efectivo', 'transferencia', 'tarjeta', 'credito')),
  monto             int not null check (monto > 0),
  monto_recibido    int,                          -- solo en efectivo, para calcular el vuelto

  unique (venta_id, forma_pago)                   -- una línea por forma, no dos de efectivo
);

create index venta_pagos_venta_id_idx on public.venta_pagos (venta_id);

comment on table public.venta_pagos is
  'La suma de monto por venta_id debe ser exactamente igual a ventas.total. '
  'Se valida con un trigger DEFERRABLE (ver 0008), no con un CHECK, porque durante '
  'el insert de líneas sueltas la suma parcial todavía no cuadra.';
