"use client";

import { useMemo, useState } from "react";
import type { ProductoLocal } from "@/lib/dexie/db";

export function BuscadorProductoVenta({
  productos,
  onAgregar,
}: {
  productos: ProductoLocal[];
  onAgregar: (producto: ProductoLocal) => void;
}) {
  const [texto, setTexto] = useState("");

  const resultados = useMemo(() => {
    const texto_ = texto.trim().toLowerCase();
    if (texto_.length === 0) return [];
    return productos
      .filter(
        (p) =>
          p.activo &&
          (p.nombre.toLowerCase().includes(texto_) ||
            (p.marca ?? "").toLowerCase().includes(texto_) ||
            (p.codigo_barras ?? "").includes(texto_))
      )
      .slice(0, 8);
  }, [productos, texto]);

  return (
    <div className="flex flex-col gap-1">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar por nombre o código…"
        className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
      />
      {resultados.length > 0 && (
        <div className="flex flex-col overflow-hidden rounded-radio border border-borde">
          {resultados.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onAgregar(p);
                setTexto("");
              }}
              className="flex h-11 items-center justify-between px-3 text-left text-sm text-texto hover:bg-superficie-alt"
            >
              <span>{p.nombre}</span>
              <span className="font-numeros text-texto-suave">${p.precio_venta}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
