import { calcularEstadoStock, type EstadoStock } from "@/lib/productos/estadoStock";

const ESTILOS: Record<EstadoStock, string> = {
  normal: "bg-ok-suave text-ok",
  bajo: "bg-alerta-suave text-alerta",
  agotado: "bg-error-suave text-error",
};

const ETIQUETAS: Record<EstadoStock, string> = {
  normal: "Normal",
  bajo: "Stock bajo",
  agotado: "Agotado",
};

export function IndicadorStock({
  stockActual,
  stockMinimo,
}: {
  stockActual: number;
  stockMinimo: number;
}) {
  const estado = calcularEstadoStock(stockActual, stockMinimo);

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-radio-chico px-2 py-1 text-xs font-medium ${ESTILOS[estado]}`}
    >
      {ETIQUETAS[estado]} · {stockActual}
    </span>
  );
}
