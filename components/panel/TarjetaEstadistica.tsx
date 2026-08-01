const COLORES = {
  neutro: "text-texto",
  acento: "text-acento",
  ok: "text-ok",
  error: "text-error",
} as const;

export function TarjetaEstadistica({
  titulo,
  valor,
  sub,
  color = "neutro",
}: {
  titulo: string;
  valor: string;
  sub?: string;
  color?: keyof typeof COLORES;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-radio border border-borde bg-superficie p-4">
      <span className="text-xs font-medium text-texto-suave">{titulo}</span>
      <span
        className={`font-numeros text-2xl font-semibold tracking-tight sm:text-[1.75rem] ${COLORES[color]}`}
      >
        {valor}
      </span>
      {sub && <span className="text-xs text-texto-suave">{sub}</span>}
    </div>
  );
}
