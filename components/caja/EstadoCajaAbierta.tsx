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
    <div className="flex flex-col gap-3 rounded-radio border border-borde bg-superficie p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ok">Caja abierta</span>
        <span className="text-xs text-texto-suave" suppressHydrationWarning>
          Desde las {new Date(abiertaEn).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div className="flex flex-col">
          <span className="text-texto-suave">Apertura</span>
          <span className="font-numeros text-texto">${montoApertura}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-texto-suave">Ingresos</span>
          <span className="font-numeros text-ok">${ingresos}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-texto-suave">Egresos</span>
          <span className="font-numeros text-error">${egresos}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-texto-suave">Calculado</span>
          <span className="font-numeros font-semibold text-texto" data-testid="caja-calculado">
            ${calculado}
          </span>
        </div>
      </div>
    </div>
  );
}
