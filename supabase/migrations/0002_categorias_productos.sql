create table public.categorias (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  orden             int not null default 0
);

create table public.productos (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  codigo_barras     text unique,                 -- nullable: no todo producto lo trae
  categoria_id      uuid references public.categorias(id),
  precio_venta      int not null,                -- pesos enteros
  precio_costo      int,                         -- carga manual, solo visible para admin
  stock_actual      int not null default 0,      -- caché, lo mantiene el trigger (ver 0008)
  stock_minimo      int not null default 5,
  activo            boolean not null default true,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

create index productos_categoria_id_idx on public.productos (categoria_id);
create index productos_activo_idx on public.productos (activo);

comment on column public.productos.stock_actual is 'Caché de solo lectura. La aplicación nunca lo escribe: lo mantiene el trigger sobre movimientos_stock.';
