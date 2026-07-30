import { calcularEstadoCuenta, type EstadoCuenta } from "@/lib/clientes/estadoCuenta";

// --color-error también cubre "deuda" (sección 7); al día y a favor son
// estados sin problema, van con --color-ok.
const ESTILOS: Record<EstadoCuenta, string> = {
  al_dia: "bg-ok-suave text-ok",
  debe: "bg-error-suave text-error",
  a_favor: "bg-ok-suave text-ok",
};

function etiqueta(saldo: number, estado: EstadoCuenta): string {
  if (estado === "al_dia") return "Al día";
  if (estado === "debe") return `Debe $${saldo}`;
  return `A favor $${Math.abs(saldo)}`;
}

export function IndicadorSaldo({ saldo }: { saldo: number }) {
  const estado = calcularEstadoCuenta(saldo);

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-radio-chico px-2 py-1 text-xs font-medium font-numeros ${ESTILOS[estado]}`}
    >
      {etiqueta(saldo, estado)}
    </span>
  );
}
