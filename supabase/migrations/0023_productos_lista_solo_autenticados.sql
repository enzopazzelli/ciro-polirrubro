-- Mismo problema que perfiles_publico (0021/0022), pero en productos_lista
-- (0009, redefinida en 0015 y 0016): la vista no tenía su propio filtro de
-- autenticación y quedaba legible por el rol anon sin sesión — no se había
-- notado porque el catálogo está vacío (decisión de la clienta), pero el
-- día que cargue productos reales, nombre/precio_venta/código de barras
-- quedarían públicos en internet sin login (precio_costo ya se enmascara
-- aparte y sigue protegido). Se agrega el mismo filtro auth_rol() is not
-- null que ya usan las políticas RLS del resto de las tablas, y se revoca
-- el grant a anon. create or replace view sí permite esto: no cambia ni
-- agrega columnas, solo suma un where.
revoke select on public.productos_lista from anon;

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
from public.productos
where public.auth_rol() is not null;

comment on view public.productos_lista is
  'Lectura de productos para ambos roles. precio_costo viene null para '
  'operador. Solo devuelve filas si quien consulta está autenticado y '
  'tiene un perfil activo (auth_rol() is not null) — sin esto, era legible '
  'por el rol anon sin sesión. La app debe leer de acá, no de la tabla '
  'productos, salvo que sea admin gestionando el catálogo.';
