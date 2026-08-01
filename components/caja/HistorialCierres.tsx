interface CierreCaja {
  id: string;
  abierta_en: string;
  cerrada_en: string | null;
  monto_apertura: number;
  monto_cierre_declarado: number | null;
  monto_cierre_calculado: number | null;
  diferencia: number | null;
}

export function HistorialCierres({ cierres }: { cierres: CierreCaja[] }) {
  if (cierres.length === 0) {
    return <p className="text-sm text-texto-suave">Todavía no hay cierres registrados.</p>;
  }

  return (
    <div className="flex flex-col gap-[var(--fila-gap)]">
      {cierres.map((c) => {
        const diferencia = c.diferencia ?? 0;
        return (
          <div
            key={c.id}
            className="flex flex-col gap-1 rounded-radio border border-borde bg-superficie px-3 py-[var(--fila-py)] text-sm transition-shadow hover:border-acento/30 hover:shadow-sm"
          >
            <span className="text-texto">
              {c.cerrada_en ? new Date(c.cerrada_en).toLocaleDateString("es-AR") : "—"} · Apertura ${c.monto_apertura}
            </span>
            <div className="flex flex-wrap gap-x-4 text-xs text-texto-suave">
              <span>Declarado: ${c.monto_cierre_declarado ?? 0}</span>
              <span>Calculado: ${c.monto_cierre_calculado ?? 0}</span>
              <span className={diferencia === 0 ? "text-ok" : "text-alerta"}>
                Diferencia: {diferencia > 0 ? "+" : ""}
                {diferencia}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
