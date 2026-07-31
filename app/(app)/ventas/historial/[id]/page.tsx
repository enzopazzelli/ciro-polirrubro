import { notFound } from "next/navigation";
import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { BotonAnularVenta } from "@/components/ventas/BotonAnularVenta";
import { ETIQUETAS_FORMA_PAGO } from "@/lib/ventas/formasDePago";

export default async function PaginaDetalleVenta({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user!.id).single();
  const esAdmin = perfil!.rol === "admin";

  const { data: venta } = await supabase
    .from("ventas")
    .select("id, numero, total, creado_en, anulada, cliente_id, usuario_id")
    .eq("id", id)
    .maybeSingle();

  if (!venta) {
    notFound();
  }

  const [{ data: items }, { data: pagos }] = await Promise.all([
    supabase
      .from("venta_items")
      .select("id, producto_id, cantidad, precio_unitario, subtotal")
      .eq("venta_id", id),
    supabase.from("venta_pagos").select("id, forma_pago, monto, monto_recibido").eq("venta_id", id),
  ]);

  const idsProductos = [...new Set((items ?? []).map((i) => i.producto_id))];
  const { data: productos } =
    idsProductos.length > 0
      ? await supabase.from("productos").select("id, nombre").in("id", idsProductos)
      : { data: [] as { id: string; nombre: string }[] };
  const nombreProducto = new Map((productos ?? []).map((p) => [p.id, p.nombre]));

  let clienteNombre: string | null = null;
  if (venta.cliente_id) {
    const { data: cliente } = await supabase.from("clientes").select("nombre").eq("id", venta.cliente_id).maybeSingle();
    clienteNombre = cliente?.nombre ?? null;
  }

  let usuarioNombre: string | null = null;
  if (venta.usuario_id) {
    const { data: usuario } = await supabase.from("perfiles").select("nombre").eq("id", venta.usuario_id).maybeSingle();
    usuarioNombre = usuario?.nombre ?? null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/ventas/historial" className="text-sm text-acento underline">
          ← Historial
        </Link>
        {venta.anulada && (
          <span className="rounded-radio-chico bg-error-suave px-3 py-1 text-sm font-medium text-error">
            Anulada
          </span>
        )}
      </div>

      <div>
        <h1 className="text-lg font-semibold text-texto">Venta #{venta.numero}</h1>
        <p className="text-sm text-texto-suave">
          {new Date(venta.creado_en).toLocaleString("es-AR")} · {clienteNombre ?? "Consumidor final"}
          {usuarioNombre ? ` · ${usuarioNombre}` : ""}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-texto-suave">Productos</h2>
        {(items ?? []).map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-2 rounded-radio border border-borde bg-superficie p-3 text-sm">
            <span className="text-texto">
              {i.cantidad} × {nombreProducto.get(i.producto_id) ?? "Producto"}
            </span>
            <span className="font-numeros text-texto">${i.subtotal}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-texto-suave">Pagos</h2>
        {(pagos ?? []).map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2 rounded-radio border border-borde bg-superficie p-3 text-sm">
            <span className="text-texto">{ETIQUETAS_FORMA_PAGO[p.forma_pago]}</span>
            <span className="font-numeros text-texto">${p.monto}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-radio bg-superficie-alt p-4">
        <span className="text-sm font-medium text-texto-suave">Total</span>
        <span className="font-numeros text-xl font-semibold text-texto">${venta.total}</span>
      </div>

      {esAdmin && !venta.anulada && <BotonAnularVenta ventaId={venta.id} />}
    </div>
  );
}
