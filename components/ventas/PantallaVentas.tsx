"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type ProductoLocal } from "@/lib/dexie/db";
import { useLectorCodigoBarras } from "@/lib/hooks/useLectorCodigoBarras";
import { reproducirBeep } from "@/lib/ventas/sonido";
import { confirmarVenta, type ItemCarrito, type LineaPago } from "@/lib/ventas/confirmarVenta";
import { LineaCarrito } from "@/components/ventas/LineaCarrito";
import { BuscadorProductoVenta } from "@/components/ventas/BuscadorProductoVenta";
import { PantallaCobro } from "@/components/ventas/PantallaCobro";
import type { Rol } from "@/types/database";

interface LineaCarritoEstado {
  producto: ProductoLocal;
  cantidad: number;
}

export function PantallaVentas({
  rol,
  usuarioId,
  cajaId,
}: {
  rol: Rol;
  usuarioId: string;
  cajaId: string | null;
}) {
  const productos = useLiveQuery(() => db.productos.toArray(), [], []);
  const clientes = useLiveQuery(() => db.clientes.toArray(), [], []);

  const [lineas, setLineas] = useState<LineaCarritoEstado[]>([]);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [avisoNoEncontrado, setAvisoNoEncontrado] = useState<string | null>(null);
  const [avisoSinStock, setAvisoSinStock] = useState<string | null>(null);
  const [mostrarCobro, setMostrarCobro] = useState(false);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);

  const total = lineas.reduce((acc, l) => acc + l.producto.precio_venta * l.cantidad, 0);

  function agregarProducto(producto: ProductoLocal) {
    setAvisoNoEncontrado(null);

    const existente = lineas.find((l) => l.producto.id === producto.id);
    const cantidadActual = existente?.cantidad ?? 0;

    if (cantidadActual + 1 > producto.stock_actual) {
      setAvisoSinStock(producto.nombre);
      return;
    }

    setAvisoSinStock(null);
    reproducirBeep();
    setFlashId(producto.id);
    setTimeout(() => setFlashId((actual) => (actual === producto.id ? null : actual)), 350);

    if (existente) {
      setLineas((actual) =>
        actual.map((l) => (l.producto.id === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l))
      );
    } else {
      setLineas((actual) => [...actual, { producto, cantidad: 1 }]);
    }
  }

  useLectorCodigoBarras((codigo) => {
    const producto = (productos ?? []).find((p) => p.codigo_barras === codigo && p.activo);
    if (!producto) {
      setAvisoSinStock(null);
      setAvisoNoEncontrado(codigo);
      return;
    }
    agregarProducto(producto);
  }, !mostrarCobro);

  function incrementar(productoId: string) {
    const linea = lineas.find((l) => l.producto.id === productoId);
    if (linea) agregarProducto(linea.producto);
  }

  function decrementar(productoId: string) {
    setLineas((actual) =>
      actual.map((l) => (l.producto.id === productoId ? { ...l, cantidad: Math.max(l.cantidad - 1, 1) } : l))
    );
  }

  function quitar(productoId: string) {
    setLineas((actual) => actual.filter((l) => l.producto.id !== productoId));
  }

  function cancelarVenta() {
    setLineas([]);
    setConfirmandoCancelar(false);
    setAvisoNoEncontrado(null);
    setAvisoSinStock(null);
  }

  async function confirmar(pagos: LineaPago[], clienteId: string | null) {
    const items: ItemCarrito[] = lineas.map((l) => ({
      producto_id: l.producto.id,
      cantidad: l.cantidad,
      precio_unitario: l.producto.precio_venta,
      subtotal: l.producto.precio_venta * l.cantidad,
    }));

    await confirmarVenta({
      clienteId,
      cajaId,
      total,
      usuarioId,
      items,
      pagos,
    });

    setLineas([]);
    setMostrarCobro(false);
    setMensajeExito(true);
    setTimeout(() => setMensajeExito(false), 2000);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-end">
        <Link href="/ventas/historial" className="text-sm text-texto-suave underline">
          Ver historial de ventas
        </Link>
      </div>

      <BuscadorProductoVenta productos={productos ?? []} onAgregar={agregarProducto} />

      {avisoNoEncontrado && (
        <div className="flex items-center justify-between gap-3 rounded-radio bg-alerta-suave px-4 py-3 text-sm text-alerta">
          <span>Código {avisoNoEncontrado} no encontrado.</span>
          <Link href={`/stock/nuevo?codigo=${encodeURIComponent(avisoNoEncontrado)}`} className="font-medium underline">
            Cargar este producto
          </Link>
        </div>
      )}

      {avisoSinStock && (
        <div className="rounded-radio bg-error-suave px-4 py-3 text-sm text-error">
          Sin stock suficiente de &quot;{avisoSinStock}&quot;.
        </div>
      )}

      {mensajeExito && (
        <div className="rounded-radio bg-ok-suave px-4 py-3 text-sm text-ok">Venta confirmada.</div>
      )}

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {lineas.length === 0 && (
          <p className="py-8 text-center text-sm text-texto-suave">
            Escaneá un producto o buscalo por nombre para empezar.
          </p>
        )}
        {lineas.map((l) => (
          <LineaCarrito
            key={l.producto.id}
            nombre={l.producto.nombre}
            cantidad={l.cantidad}
            subtotal={l.producto.precio_venta * l.cantidad}
            flash={flashId === l.producto.id}
            onIncrementar={() => incrementar(l.producto.id)}
            onDecrementar={() => decrementar(l.producto.id)}
            onQuitar={() => quitar(l.producto.id)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-borde bg-fondo pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-texto-suave">Total</span>
          <span className="font-numeros text-2xl font-semibold text-texto">${total}</span>
        </div>

        {confirmandoCancelar ? (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmandoCancelar(false)}
              className="h-11 flex-1 rounded-radio border border-borde text-sm text-texto"
            >
              Seguir con la venta
            </button>
            <button
              onClick={cancelarVenta}
              className="h-11 flex-1 rounded-radio border border-error text-sm text-error"
            >
              Sí, cancelar
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {lineas.length > 0 && (
              <button
                onClick={() => setConfirmandoCancelar(true)}
                className="h-14 rounded-radio border border-borde px-4 text-sm text-texto-suave"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={() => setMostrarCobro(true)}
              disabled={lineas.length === 0}
              className="h-14 flex-1 rounded-radio bg-acento text-base font-semibold text-acento-texto disabled:opacity-40"
            >
              Cobrar
            </button>
          </div>
        )}
      </div>

      {mostrarCobro && (
        <PantallaCobro
          total={total}
          clientes={clientes ?? []}
          rol={rol}
          onConfirmar={confirmar}
          onCerrar={() => setMostrarCobro(false)}
        />
      )}
    </div>
  );
}
