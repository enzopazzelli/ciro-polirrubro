-- INMUTABLE: sin UPDATE ni DELETE (se aplica en 0009 con RLS: no hay política para esas operaciones).
create table public.movimientos_stock (
  id                uuid primary key default gen_random_uuid(),
  producto_id       uuid not null references public.productos(id),
  cantidad          int not null,                -- negativo en ventas, positivo en ingresos
  tipo              text not null check (tipo in ('venta', 'ingreso', 'ajuste', 'devolucion')),
  referencia_id     uuid,                        -- id de la venta que lo originó, si aplica
  motivo            text,                        -- obligatorio en 'ajuste' e 'ingreso' (ver check abajo)
  usuario_id        uuid references public.perfiles(id),
  creado_en         timestamptz not null default now(),
  creado_en_local   timestamptz,                 -- hora del dispositivo, para ordenar

  constraint movimientos_stock_motivo_requerido
    check (tipo not in ('ajuste', 'ingreso') or motivo is not null)
);

create index movimientos_stock_producto_id_idx on public.movimientos_stock (producto_id);
create index movimientos_stock_creado_en_idx on public.movimientos_stock (creado_en);

comment on table public.movimientos_stock is 'Tabla de movimientos inmutable. stock_actual = suma de cantidad. Ver trigger en 0008.';
