"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

interface VentaHistorial {
  id: string;
  numero: number;
  total: number;
  creado_en: string;
  anulada: boolean;
  cliente_nombre: string | null;
  usuario_nombre: string | null;
}

export function ListaHistorialVentas({ ventas }: { ventas: VentaHistorial[] }) {
  const [texto, setTexto] = useState("");

  const filtradas = useMemo(() => {
    const texto_ = texto.trim().toLowerCase();
    if (texto_.length === 0) return ventas;
    return ventas.filter(
      (v) =>
        String(v.numero).includes(texto_) ||
        (v.cliente_nombre ?? "").toLowerCase().includes(texto_)
    );
  }, [ventas, texto]);

  return (
    <div className="flex flex-col gap-4">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar por número o cliente…"
        className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
      />

      <div className="flex flex-col gap-[var(--fila-gap)]">
        {filtradas.length === 0 && (
          <p className="text-sm text-texto-suave">No hay ventas que coincidan.</p>
        )}
        {filtradas.map((v) => (
          <Link
            key={v.id}
            href={`/ventas/historial/${v.id}`}
            className="flex items-center justify-between gap-3 rounded-radio border border-borde bg-superficie px-3 py-[var(--fila-py)] hover:bg-superficie-alt"
          >
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-medium text-texto">
                #{v.numero} · {v.cliente_nombre ?? "Consumidor final"}
                {v.anulada && (
                  <span className="rounded-radio-chico bg-error-suave px-2 py-0.5 text-xs font-medium text-error">
                    Anulada
                  </span>
                )}
              </span>
              <span className="text-xs text-texto-suave">
                {new Date(v.creado_en).toLocaleString("es-AR")}
                {v.usuario_nombre ? ` · ${v.usuario_nombre}` : ""}
              </span>
            </div>
            <span className="font-numeros text-sm text-texto">${v.total}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
