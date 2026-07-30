-- Sección 4.5: el flujo real es mostrador → dueña. Ella se
-- suscribe a estas tres tablas para ver la actividad del local
-- mientras está afuera. El mostrador no se suscribe a nada.
alter publication supabase_realtime add table public.ventas;
alter publication supabase_realtime add table public.movimientos_stock;
alter publication supabase_realtime add table public.movimientos_cuenta;
