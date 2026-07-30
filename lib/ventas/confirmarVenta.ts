import { db } from "@/lib/dexie/db";
import { agregarAOutbox } from "@/lib/sync/outbox";
import type { FormaPago } from "@/types/database";

export interface ItemCarrito {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface LineaPago {
  forma_pago: FormaPago;
  monto: number;
  monto_recibido: number | null;
}

const CLAVE_DISPOSITIVO = "ciro_dispositivo_id";

function obtenerIdDispositivo(): string {
  let id = localStorage.getItem(CLAVE_DISPOSITIVO);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLAVE_DISPOSITIVO, id);
  }
  return id;
}

/**
 * Escribe la venta en Dexie (incluido el descuento de stock local,
 * para que el próximo escaneo en la misma sesión offline vea el
 * stock real — sección 4.4) y encola la llamada RPC que la aplica
 * de verdad en Supabase. La interfaz puede considerar la venta
 * confirmada apenas esto termina: no espera a la red.
 */
export async function confirmarVenta(args: {
  clienteId: string | null;
  cajaId: string | null;
  total: number;
  usuarioId: string;
  items: ItemCarrito[];
  pagos: LineaPago[];
}): Promise<string> {
  const ventaId = crypto.randomUUID();
  const ahora = new Date();

  await db.transaction("rw", db.productos, db.ventas, db.venta_items, db.venta_pagos, async () => {
    for (const item of args.items) {
      const producto = await db.productos.get(item.producto_id);
      if (producto) {
        await db.productos.update(item.producto_id, {
          stock_actual: producto.stock_actual - item.cantidad,
        });
      }
    }

    await db.ventas.add({
      id: ventaId,
      numero: null,
      cliente_id: args.clienteId,
      usuario_id: args.usuarioId,
      total: args.total,
      caja_id: args.cajaId,
      anulada: false,
      creado_en_local: ahora.getTime(),
    });

    for (const item of args.items) {
      await db.venta_items.add({
        id: crypto.randomUUID(),
        venta_id: ventaId,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      });
    }

    for (const pago of args.pagos) {
      await db.venta_pagos.add({
        id: crypto.randomUUID(),
        venta_id: ventaId,
        forma_pago: pago.forma_pago,
        monto: pago.monto,
        monto_recibido: pago.monto_recibido,
      });
    }
  });

  await agregarAOutbox("rpc", "confirmar_venta", {
    p_venta_id: ventaId,
    p_cliente_id: args.clienteId,
    p_caja_id: args.cajaId,
    p_total: args.total,
    p_creado_en_local: ahora.toISOString(),
    p_dispositivo_id: obtenerIdDispositivo(),
    p_items: args.items,
    p_pagos: args.pagos,
  });

  return ventaId;
}
