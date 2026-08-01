import { Avatar } from "@/components/ui/Avatar";
import type { TipoMovimientoStock } from "@/types/database";

interface Movimiento {
  id: string;
  cantidad: number;
  tipo: TipoMovimientoStock;
  motivo: string | null;
  creado_en: string;
  usuario_nombre: string | null;
}

const ETIQUETAS_TIPO: Record<TipoMovimientoStock, string> = {
  venta: "Venta",
  ingreso: "Ingreso",
  ajuste: "Ajuste",
  devolucion: "Devolución",
};

export function HistorialMovimientos({ movimientos }: { movimientos: Movimiento[] }) {
  if (movimientos.length === 0) {
    return <p className="text-sm text-texto-suave">Todavía no hay movimientos para este producto.</p>;
  }

  return (
    <div className="flex flex-col gap-[var(--fila-gap)]">
      {movimientos.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-3 rounded-radio border border-borde bg-superficie px-3 py-[var(--fila-py-chico)] text-sm transition-shadow hover:border-acento/30 hover:shadow-sm"
        >
          <Avatar nombre={m.usuario_nombre ?? "?"} tamano="sm" />
          <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
            <span className="text-texto">
              {ETIQUETAS_TIPO[m.tipo]}
              {m.motivo ? ` · ${m.motivo}` : ""}
            </span>
            <span className="text-xs text-texto-suave">
              {new Date(m.creado_en).toLocaleString("es-AR")}
              {m.usuario_nombre ? ` · ${m.usuario_nombre}` : ""}
            </span>
          </div>
          <span className={`font-numeros font-medium ${m.cantidad < 0 ? "text-error" : "text-ok"}`}>
            {m.cantidad > 0 ? "+" : ""}
            {m.cantidad}
          </span>
        </div>
      ))}
    </div>
  );
}
