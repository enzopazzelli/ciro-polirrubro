import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioApertura } from "@/components/caja/FormularioApertura";
import { EstadoCajaAbierta } from "@/components/caja/EstadoCajaAbierta";
import { FormularioGasto } from "@/components/caja/FormularioGasto";
import { FormularioCierre } from "@/components/caja/FormularioCierre";
import { HistorialCierres } from "@/components/caja/HistorialCierres";
import { Tarjeta } from "@/components/panel/Tarjeta";

export default async function PaginaCaja() {
  const supabase = await crearClienteServidor();

  // cajasAbiertas y cierres no dependen entre sí: se piden en paralelo.
  const [{ data: cajasAbiertas }, { data: cierres }] = await Promise.all([
    supabase
      .from("cajas")
      .select("id, abierta_en, monto_apertura")
      .eq("estado", "abierta")
      .order("abierta_en", { ascending: false })
      .limit(1),
    supabase
      .from("cajas")
      .select("id, abierta_en, cerrada_en, monto_apertura, monto_cierre_declarado, monto_cierre_calculado, diferencia")
      .eq("estado", "cerrada")
      .order("cerrada_en", { ascending: false })
      .limit(20),
  ]);
  const cajaAbierta = cajasAbiertas?.[0] ?? null;

  let ingresos = 0;
  let egresos = 0;
  let gastosDeHoy: { id: string; concepto: string; monto: number }[] = [];

  if (cajaAbierta) {
    const { data: movimientos } = await supabase
      .from("movimientos_caja")
      .select("id, tipo, concepto, monto")
      .eq("caja_id", cajaAbierta.id)
      .order("creado_en", { ascending: false });

    for (const m of movimientos ?? []) {
      if (m.tipo === "ingreso") ingresos += m.monto;
      if (m.tipo === "egreso") egresos += m.monto;
    }
    gastosDeHoy = (movimientos ?? []).filter((m) => m.tipo === "egreso");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-texto">Caja</h1>

      {cajaAbierta ? (
        <>
          <EstadoCajaAbierta
            abiertaEn={cajaAbierta.abierta_en}
            montoApertura={cajaAbierta.monto_apertura}
            ingresos={ingresos}
            egresos={egresos}
          />
          <FormularioGasto cajaId={cajaAbierta.id} gastosDeHoy={gastosDeHoy} />
          <FormularioCierre cajaId={cajaAbierta.id} calculado={cajaAbierta.monto_apertura + ingresos - egresos} />
        </>
      ) : (
        <FormularioApertura />
      )}

      <Tarjeta titulo="Historial de cierres" badge={`${(cierres ?? []).length} cierres`}>
        <HistorialCierres cierres={cierres ?? []} />
      </Tarjeta>
    </div>
  );
}
