"use client";

export function BuscadorClientes({
  texto,
  onTextoChange,
}: {
  texto: string;
  onTextoChange: (valor: string) => void;
}) {
  return (
    <input
      type="text"
      placeholder="Buscar por nombre…"
      value={texto}
      onChange={(e) => onTextoChange(e.target.value)}
      className="h-11 flex-1 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
    />
  );
}
