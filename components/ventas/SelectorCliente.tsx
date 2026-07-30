"use client";

import { useMemo, useState } from "react";
import type { ClienteLocal } from "@/lib/dexie/db";

export function SelectorCliente({
  clientes,
  clienteSeleccionado,
  onSeleccionar,
}: {
  clientes: ClienteLocal[];
  clienteSeleccionado: ClienteLocal | null;
  onSeleccionar: (cliente: ClienteLocal | null) => void;
}) {
  const [texto, setTexto] = useState("");

  const resultados = useMemo(() => {
    const texto_ = texto.trim().toLowerCase();
    if (texto_.length === 0) return [];
    return clientes.filter((c) => c.activo && c.nombre.toLowerCase().includes(texto_)).slice(0, 6);
  }, [clientes, texto]);

  if (clienteSeleccionado) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-radio border border-borde bg-superficie p-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-texto">{clienteSeleccionado.nombre}</span>
          <span className="text-xs text-texto-suave">
            Saldo actual: ${clienteSeleccionado.saldo} · Límite: ${clienteSeleccionado.limite_credito}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSeleccionar(null)}
          className="h-11 shrink-0 rounded-radio-chico border border-borde px-3 text-sm text-texto-suave"
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar cliente por nombre…"
        className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
      />
      {resultados.length > 0 && (
        <div className="flex flex-col overflow-hidden rounded-radio border border-borde">
          {resultados.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSeleccionar(c);
                setTexto("");
              }}
              className="flex h-11 items-center justify-between px-3 text-left text-sm text-texto hover:bg-superficie-alt"
            >
              <span>{c.nombre}</span>
              <span className="font-numeros text-texto-suave">Saldo ${c.saldo}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
