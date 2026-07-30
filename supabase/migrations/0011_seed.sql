-- Categorías
insert into public.categorias (nombre, orden) values
  ('Maquillaje',     1),
  ('Regalería',      2),
  ('Marroquinería',  3),
  ('Bijouterie',     4),
  ('Perfumería',     5);

-- Productos (20). El stock inicial NO se pone acá: se carga como
-- un ingreso real más abajo, para que pase por el mismo mecanismo
-- que va a usar la pantalla de stock (sección 4.1 y Etapa 2).
insert into public.productos (nombre, codigo_barras, categoria_id, precio_venta, precio_costo, stock_minimo)
select v.nombre, v.codigo_barras, c.id, v.precio_venta, v.precio_costo, v.stock_minimo
from (values
  ('Labial mate rojo',              '7791234500011', 'Maquillaje',     4500,  2200, 5),
  ('Base líquida tono claro',       '7791234500028', 'Maquillaje',     8900,  4500, 5),
  ('Rímel volumen',                 '7791234500035', 'Maquillaje',     5200,  2600, 5),
  ('Sombras paleta x12',            '7791234500042', 'Maquillaje',     7800,  4000, 5),
  ('Delineador líquido negro',      '7791234500059', 'Maquillaje',     3200,  1500, 5),
  ('Esmalte de uñas',               '7791234500066', 'Maquillaje',     2100,  900,  10),
  ('Set de brochas x6',             '7791234500073', 'Maquillaje',     9500,  5000, 5),
  ('Taza mágica personalizada',     '7791234500080', 'Regalería',      6500,  3200, 8),
  ('Portarretrato 15x20',           '7791234500097', 'Regalería',      4200,  2000, 6),
  ('Vela aromática lavanda',        '7791234500103', 'Regalería',      3800,  1800, 8),
  ('Peluche oso 30cm',              '7791234500110', 'Regalería',      7200,  3600, 4),
  ('Llavero acrílico',              '7791234500127', 'Regalería',      1500,  600,  15),
  ('Cartera de mano negra',         '7791234500134', 'Marroquinería',  15900, 8500, 3),
  ('Billetera de cuero ecológico',  '7791234500141', 'Marroquinería',  9800,  5200, 4),
  ('Mochila urbana',                '7791234500158', 'Marroquinería',  22500, 13000,3),
  ('Cinturón unisex',               '7791234500165', 'Marroquinería',  6800,  3400, 6),
  ('Aros de acero quirúrgico',      '7791234500172', 'Bijouterie',     2800,  1200, 10),
  ('Collar chapa dorada',           '7791234500189', 'Bijouterie',     3600,  1600, 8),
  ('Pulsera trenzada',              '7791234500196', 'Bijouterie',     1900,  800,  10),
  ('Perfume mujer 50ml',            '7791234500202', 'Perfumería',     12500, 6800, 4)
) as v(nombre, codigo_barras, categoria_nombre, precio_venta, precio_costo, stock_minimo)
join public.categorias c on c.nombre = v.categoria_nombre;

-- Ingreso inicial de mercadería: un movimiento real por producto.
insert into public.movimientos_stock (producto_id, cantidad, tipo, motivo)
select p.id, v.cantidad, 'ingreso', 'Carga inicial'
from public.productos p
join (values
  ('7791234500011', 20),
  ('7791234500028', 12),
  ('7791234500035', 18),
  ('7791234500042', 10),
  ('7791234500059', 25),
  ('7791234500066', 30),
  ('7791234500073', 8),
  ('7791234500080', 15),
  ('7791234500097', 12),
  ('7791234500103', 20),
  ('7791234500110', 9),
  ('7791234500127', 40),
  ('7791234500134', 6),
  ('7791234500141', 10),
  ('7791234500158', 5),
  ('7791234500165', 14),
  ('7791234500172', 22),
  ('7791234500189', 16),
  ('7791234500196', 28),
  ('7791234500202', 7)
) as v(codigo_barras, cantidad) on v.codigo_barras = p.codigo_barras;

-- Clientes
insert into public.clientes (nombre, telefono, limite_credito) values
  ('María Gómez',       '3854123456', 15000),
  ('Juan Pérez',        '3854234567', 10000),
  ('Lucía Fernández',   '3854345678', 20000),
  ('Carlos Rodríguez',  '3854456789', 0),
  ('Ana Martínez',      '3854567890', 12000),
  ('Roberto Sánchez',   '3854678901', 8000);

-- Los dos usuarios iniciales (admin/operador) no se crean acá:
-- requieren pasar por Supabase Auth. Ver scripts/seed-usuarios.mjs.
