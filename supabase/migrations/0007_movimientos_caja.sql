-- INMUTABLE: sin UPDATE ni DELETE.
create table public.movimientos_caja (
  id                uuid primary key default gen_random_uuid(),
  caja_id           uuid not null references public.cajas(id),
  tipo              text not null check (tipo in ('ingreso', 'egreso')),
  concepto          text not null,
  monto             int not null,
  venta_id          uuid references public.ventas(id),   -- null si es un gasto manual
  usuario_id        uuid references public.perfiles(id),
  creado_en         timestamptz not null default now()
);

create index movimientos_caja_caja_id_idx on public.movimientos_caja (caja_id);

comment on table public.movimientos_caja is 'Solo el efectivo pasa por acá. Transferencias y tarjetas se registran en venta_pagos pero no afectan el arqueo.';
