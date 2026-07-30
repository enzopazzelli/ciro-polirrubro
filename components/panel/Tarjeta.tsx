export function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-radio border border-borde bg-superficie p-4">
      <h2 className="text-sm font-semibold text-texto-suave">{titulo}</h2>
      {children}
    </div>
  );
}
