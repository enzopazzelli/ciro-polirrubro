import { TarjetaEstadistica } from "@/components/panel/TarjetaEstadistica";

export function EstadoCajaAbierta({
  abiertaEn,
  montoApertura,
  ingresos,
  egresos,
}: {
  abiertaEn: string;
  montoApertura: number;
  ingresos: number;
  egresos: number;
}) {
  const calculado = montoApertura + ingresos - egresos;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-ok" aria-hidden />
        <span className="text-sm font-semibold text-ok">Caja abierta</span>
        <span className="text-xs text-texto-suave" suppressHydrationWarning>
          · Desde las {new Date(abiertaEn).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TarjetaEstadistica titulo="Apertura" valor={`$${montoApertura}`} />
        <TarjetaEstadistica titulo="Ingresos" valor={`$${ingresos}`} color="ok" />
        <TarjetaEstadistica titulo="Egresos" valor={`$${egresos}`} color={egresos > 0 ? "error" : "neutro"} />
        <TarjetaEstadistica titulo="Calculado" valor={`$${calculado}`} color="acento" />
      </div>
    </div>
  );
}
