import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { generarExcelVentas } from "@/lib/excel/exportarVentas";
import { ETIQUETAS_FORMA_PAGO } from "@/lib/ventas/formasDePago";
import type { FormaPago } from "@/types/database";

export async function GET() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: ventas } = await supabase
    .from("ventas")
    .select("id, numero, total, creado_en, anulada, cliente_id, usuario_id")
    .order("creado_en", { ascending: false });

  const idsVentas = (ventas ?? []).map((v) => v.id);
  const { data: pagos } =
    idsVentas.length > 0
      ? await supabase.from("venta_pagos").select("venta_id, forma_pago, monto").in("venta_id", idsVentas)
      : { data: [] as { venta_id: string; forma_pago: FormaPago; monto: number }[] };

  const pagosPorVenta = new Map<string, { forma_pago: FormaPago; monto: number }[]>();
  for (const p of pagos ?? []) {
    const lista = pagosPorVenta.get(p.venta_id) ?? [];
    lista.push(p);
    pagosPorVenta.set(p.venta_id, lista);
  }

  const idsClientes = [...new Set((ventas ?? []).map((v) => v.cliente_id).filter((v): v is string => !!v))];
  const idsUsuarios = [...new Set((ventas ?? []).map((v) => v.usuario_id).filter((v): v is string => !!v))];
  const [{ data: clientes }, { data: usuarios }] = await Promise.all([
    idsClientes.length > 0
      ? supabase.from("clientes").select("id, nombre").in("id", idsClientes)
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    idsUsuarios.length > 0
      ? supabase.from("perfiles_publico").select("id, nombre").in("id", idsUsuarios)
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
  ]);
  const nombreCliente = new Map((clientes ?? []).map((c) => [c.id, c.nombre]));
  const nombreUsuario = new Map((usuarios ?? []).map((u) => [u.id, u.nombre]));

  const buffer = await generarExcelVentas(
    (ventas ?? []).map((v) => ({
      numero: v.numero,
      creado_en: v.creado_en,
      cliente: v.cliente_id ? (nombreCliente.get(v.cliente_id) ?? null) : null,
      vendedor: v.usuario_id ? (nombreUsuario.get(v.usuario_id) ?? null) : null,
      formas_de_pago: (pagosPorVenta.get(v.id) ?? [])
        .map((p) => `${ETIQUETAS_FORMA_PAGO[p.forma_pago]}: $${p.monto}`)
        .join(", "),
      total: v.total,
      anulada: v.anulada,
    }))
  );

  // Cast puntual: TS más nuevo tipa Uint8Array como genérico sobre
  // ArrayBuffer específicamente (no ArrayBufferLike), y exceljs
  // devuelve un buffer tipado más laxo. En runtime siempre es un
  // ArrayBuffer real, nunca un SharedArrayBuffer.
  return new NextResponse(new Blob([buffer as unknown as BlobPart]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ventas-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
