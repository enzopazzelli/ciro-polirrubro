import type { crearClienteServidor } from "@/lib/supabase/server";
import { ordenarClientesConDeudaPorAntiguedad } from "@/lib/clientes/ordenarPorAntiguedad";
import { calcularEstadoStock } from "@/lib/productos/estadoStock";
import type { FormaPago } from "@/types/database";

type ClienteSupabase = Awaited<ReturnType<typeof crearClienteServidor>>;

export interface DatosPanel {
  ventasDelDia: { total: number; cantidad: number };
  stockCritico: { id: string; nombre: string; stock_actual: number; stock_minimo: number }[];
  caja: { id: string; abierta_en: string; monto_apertura: number } | null;
  // Solo se completan para admin (ver obtenerDatosPanel).
  desglosePorFormaPago: { forma_pago: FormaPago; monto: number }[];
  clientesConDeuda: { id: string; nombre: string; saldo: number }[];
  ultimasVentas: {
    id: string;
    numero: number;
    total: number;
    creado_en: string;
    cliente_nombre: string | null;
    usuario_nombre: string | null;
  }[];
}

/** Argentina es UTC-3 fijo (sin horario de verano). */
function inicioDelDiaArgentina(ahora = new Date()): Date {
  const offsetMs = 3 * 60 * 60 * 1000;
  const local = new Date(ahora.getTime() - offsetMs);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + offsetMs);
}

export async function obtenerDatosPanel(supabase: ClienteSupabase, esAdmin: boolean): Promise<DatosPanel> {
  const inicioHoy = inicioDelDiaArgentina().toISOString();

  const [{ data: ventasHoy }, { data: productos }, { data: cajasAbiertas }] = await Promise.all([
    supabase
      .from("ventas")
      .select("id, total, creado_en")
      .eq("anulada", false)
      .gte("creado_en", inicioHoy)
      .order("creado_en", { ascending: false }),
    supabase.from("productos").select("id, nombre, stock_actual, stock_minimo").eq("activo", true),
    supabase
      .from("cajas")
      .select("id, abierta_en, monto_apertura")
      .eq("estado", "abierta")
      .order("abierta_en", { ascending: false })
      .limit(1),
  ]);

  const ventasDelDia = {
    total: (ventasHoy ?? []).reduce((acc, v) => acc + v.total, 0),
    cantidad: (ventasHoy ?? []).length,
  };

  const stockCritico = (productos ?? [])
    .filter((p) => calcularEstadoStock(p.stock_actual, p.stock_minimo) !== "normal")
    .sort((a, b) => a.stock_actual - b.stock_actual);

  const caja = cajasAbiertas?.[0] ?? null;

  if (!esAdmin) {
    return {
      ventasDelDia,
      stockCritico,
      caja,
      desglosePorFormaPago: [],
      clientesConDeuda: [],
      ultimasVentas: [],
    };
  }

  const idsVentasHoy = (ventasHoy ?? []).map((v) => v.id);

  const [{ data: pagosHoy }, { data: clientes }, { data: movimientosCuenta }, { data: ultimasVentasRaw }] =
    await Promise.all([
      idsVentasHoy.length > 0
        ? supabase.from("venta_pagos").select("forma_pago, monto").in("venta_id", idsVentasHoy)
        : Promise.resolve({ data: [] as { forma_pago: FormaPago; monto: number }[] }),
      supabase.from("clientes").select("id, nombre, saldo").eq("activo", true),
      supabase.from("movimientos_cuenta").select("cliente_id, creado_en").order("creado_en", { ascending: false }),
      supabase
        .from("ventas")
        .select("id, numero, total, creado_en, cliente_id, usuario_id")
        .order("creado_en", { ascending: false })
        .limit(15),
    ]);

  const desglosePorFormaPagoMap = new Map<FormaPago, number>();
  for (const p of pagosHoy ?? []) {
    desglosePorFormaPagoMap.set(p.forma_pago, (desglosePorFormaPagoMap.get(p.forma_pago) ?? 0) + p.monto);
  }
  const desglosePorFormaPago = [...desglosePorFormaPagoMap.entries()].map(([forma_pago, monto]) => ({
    forma_pago,
    monto,
  }));

  const ultimaActividadPorCliente: Record<string, string> = {};
  for (const m of movimientosCuenta ?? []) {
    if (!(m.cliente_id in ultimaActividadPorCliente)) {
      ultimaActividadPorCliente[m.cliente_id] = m.creado_en;
    }
  }
  const clientesConDeuda = ordenarClientesConDeudaPorAntiguedad(clientes ?? [], ultimaActividadPorCliente);

  const idsClientes = [
    ...new Set((ultimasVentasRaw ?? []).map((v) => v.cliente_id).filter((v): v is string => !!v)),
  ];
  const idsUsuarios = [
    ...new Set((ultimasVentasRaw ?? []).map((v) => v.usuario_id).filter((v): v is string => !!v)),
  ];
  const [{ data: clientesNombres }, { data: usuariosNombres }] = await Promise.all([
    idsClientes.length > 0
      ? supabase.from("clientes").select("id, nombre").in("id", idsClientes)
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    idsUsuarios.length > 0
      ? supabase.from("perfiles").select("id, nombre").in("id", idsUsuarios)
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
  ]);
  const nombreCliente = new Map((clientesNombres ?? []).map((c) => [c.id, c.nombre]));
  const nombreUsuario = new Map((usuariosNombres ?? []).map((u) => [u.id, u.nombre]));

  const ultimasVentas = (ultimasVentasRaw ?? []).map((v) => ({
    id: v.id,
    numero: v.numero,
    total: v.total,
    creado_en: v.creado_en,
    cliente_nombre: v.cliente_id ? (nombreCliente.get(v.cliente_id) ?? null) : null,
    usuario_nombre: v.usuario_id ? (nombreUsuario.get(v.usuario_id) ?? null) : null,
  }));

  return { ventasDelDia, stockCritico, caja, desglosePorFormaPago, clientesConDeuda, ultimasVentas };
}
