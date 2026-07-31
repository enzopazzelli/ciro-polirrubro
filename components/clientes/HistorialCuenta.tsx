import type { TipoMovimientoCuenta } from "@/types/database";

interface Movimiento {
  id: string;
  monto: number;
  tipo: TipoMovimientoCuenta;
  creado_en: string;
  usuario_nombre: string | null;
}

const ETIQUETAS_TIPO: Record<TipoMovimientoCuenta, string> = {
  cargo: "Cargo",
  pago: "Pago",
  ajuste: "Ajuste",
};

export function HistorialCuenta({ movimientos }: { movimientos: Movimiento[] }) {
  if (movimientos.length === 0) {
    return <p className="text-sm text-texto-suave">Todavía no hay movimientos para este cliente.</p>;
  }

  return (
    <div className="flex flex-col gap-[var(--fila-gap)]">
      {movimientos.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between gap-3 rounded-radio border border-borde bg-superficie px-3 py-[var(--fila-py-chico)] text-sm"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-texto">{ETIQUETAS_TIPO[m.tipo]}</span>
            <span className="text-xs text-texto-suave">
              {new Date(m.creado_en).toLocaleString("es-AR")}
              {m.usuario_nombre ? ` · ${m.usuario_nombre}` : ""}
            </span>
          </div>
          <span className={`font-numeros font-medium ${m.monto > 0 ? "text-error" : "text-ok"}`}>
            {m.monto > 0 ? "+" : ""}
            {m.monto}
          </span>
        </div>
      ))}
    </div>
  );
}
