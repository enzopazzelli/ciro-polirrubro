-- El mostrador (SincronizadorFondo) necesita enterarse cuando
-- cambian productos, categorías o clientes durante la misma sesión
-- para refrescar su caché local (Dexie) sin esperar a un reload de
-- página o a recuperar conexión. Sección 4.4/4.5 ya usaba realtime
-- para el sentido mostrador → dueña (0010); esto agrega el sentido
-- inverso, dueña/otra pantalla → mostrador.
alter publication supabase_realtime add table public.productos;
alter publication supabase_realtime add table public.categorias;
alter publication supabase_realtime add table public.clientes;
