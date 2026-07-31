-- ============================================================
-- Campos adicionales (roadmap post-entrega): dirección y notas
-- para clientes, marca para productos. Sin restricción de rol
-- particular: se editan igual que el resto de los datos básicos
-- de cada tabla (ver 0008 y 0009 para las columnas que sí están
-- restringidas: limite_credito/activo en clientes, precio_costo
-- en productos).
-- ============================================================
alter table public.clientes
  add column direccion text,
  add column notas text;

alter table public.productos
  add column marca text;

-- CREATE OR REPLACE VIEW solo permite agregar columnas al final
-- sin tocar el orden de las existentes; por eso "marca" va al final.
create or replace view public.productos_lista as
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
  actualizado_en,
  marca
from public.productos;
