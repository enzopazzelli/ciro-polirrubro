create table public.clientes (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  telefono          text,
  limite_credito    int not null default 0,
  saldo             int not null default 0,      -- caché, lo mantiene el trigger (ver 0008)
  activo            boolean not null default true,
  creado_en         timestamptz not null default now()
);

create index clientes_activo_idx on public.clientes (activo);

comment on column public.clientes.saldo is 'Caché de solo lectura. La aplicación nunca lo escribe: lo mantiene el trigger sobre movimientos_cuenta.';

-- INMUTABLE: sin UPDATE ni DELETE.
create table public.movimientos_cuenta (
  id                uuid primary key default gen_random_uuid(),
  cliente_id        uuid not null references public.clientes(id),
  monto             int not null,                -- positivo = deuda, negativo = pago
  tipo              text not null check (tipo in ('cargo', 'pago', 'ajuste')),
  venta_id          uuid,                        -- FK real a ventas se agrega en 0006 (ventas todavía no existe)
  usuario_id        uuid references public.perfiles(id),
  creado_en         timestamptz not null default now()
);

create index movimientos_cuenta_cliente_id_idx on public.movimientos_cuenta (cliente_id);
create index movimientos_cuenta_creado_en_idx on public.movimientos_cuenta (creado_en);

comment on table public.movimientos_cuenta is 'Tabla de movimientos inmutable. saldo = suma de monto. Ver trigger en 0008.';
