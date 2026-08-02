-- Cierra dos huecos reales encontrados en una revisión de integridad
-- post-entrega (2026-08-01), ninguno explotado, ambos verificados contra
-- los datos reales antes de aplicar (no había ninguna fila que los violara).

-- 1. cajas_validar_apertura_unica (0013) hace un "select ... exists" antes
-- de insertar, sin ningún bloqueo — dos aperturas casi simultáneas (dos
-- toques rápidos, dos dispositivos) podrían pasar el chequeo las dos
-- antes de que cualquiera confirme, y terminar con dos cajas abiertas a
-- la vez. Un índice único parcial lo hace imposible a nivel de la base
-- misma, sin depender de un chequeo previo que puede perder la carrera.
-- El trigger de 0013 sigue estando: da el mensaje amigable en el caso
-- normal (secuencial); este índice es el respaldo real para el caso raro.
create unique index cajas_una_abierta_idx on public.cajas (estado) where (estado = 'abierta');

-- 2. movimientos_caja.monto no tenía "check (monto > 0)", a diferencia de
-- venta_pagos.monto (0006) que sí lo tiene — el mínimo de $1 solo lo
-- exigía el formulario (HTML), no la base. Un pedido directo a la API
-- (saltándose la pantalla) podía cargar un gasto negativo y descuadrar
-- el arqueo calculado (apertura + ingresos - egresos).
alter table public.movimientos_caja
  add constraint movimientos_caja_monto_positivo check (monto > 0);
