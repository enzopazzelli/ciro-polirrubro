export function Tarjeta({
  titulo,
  badge,
  children,
}: {
  titulo: string;
  /** Contador o etiqueta corta a la derecha del título (ej. "4 productos"). */
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-radio border border-borde bg-superficie p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-texto">{titulo}</h2>
        {badge && (
          <span className="shrink-0 rounded-full bg-acento-suave px-2.5 py-0.5 text-xs font-medium text-acento">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
