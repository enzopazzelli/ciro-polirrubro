"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BuscadorClientes } from "@/components/clientes/BuscadorClientes";
import { IndicadorSaldo } from "@/components/clientes/IndicadorSaldo";
import { ordenarClientesConDeudaPorAntiguedad } from "@/lib/clientes/ordenarPorAntiguedad";

interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  saldo: number;
}

export function ListaClientes({
  clientes,
  ultimaActividadPorCliente,
}: {
  clientes: Cliente[];
  ultimaActividadPorCliente: Record<string, string>;
}) {
  const [texto, setTexto] = useState("");
  const [soloDeuda, setSoloDeuda] = useState(false);

  const filtrados = useMemo(() => {
    const texto_ = texto.trim().toLowerCase();
    let lista = clientes.filter((c) => texto_.length === 0 || c.nombre.toLowerCase().includes(texto_));

    if (soloDeuda) {
      lista = ordenarClientesConDeudaPorAntiguedad(lista, ultimaActividadPorCliente);
    } else {
      lista = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return lista;
  }, [clientes, texto, soloDeuda, ultimaActividadPorCliente]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-texto">Clientes</h1>
        <Link
          href="/clientes/nuevo"
          className="flex h-11 items-center justify-center rounded-radio bg-acento px-4 text-sm font-medium text-acento-texto"
        >
          Nuevo cliente
        </Link>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <BuscadorClientes texto={texto} onTextoChange={setTexto} />
        <button
          type="button"
          onClick={() => setSoloDeuda((v) => !v)}
          className={`h-11 shrink-0 rounded-radio border px-4 text-sm font-medium ${
            soloDeuda ? "border-acento bg-acento-suave text-acento" : "border-borde text-texto-suave"
          }`}
        >
          Con deuda, por antigüedad
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {filtrados.length === 0 && (
          <p className="text-sm text-texto-suave">No hay clientes que coincidan.</p>
        )}
        {filtrados.map((c) => (
          <Link
            key={c.id}
            href={`/clientes/${c.id}`}
            className="flex items-center justify-between gap-3 rounded-radio border border-borde bg-superficie p-3 hover:bg-superficie-alt"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-texto">{c.nombre}</span>
              {c.telefono && <span className="text-xs text-texto-suave">{c.telefono}</span>}
            </div>
            <IndicadorSaldo saldo={c.saldo} />
          </Link>
        ))}
      </div>
    </div>
  );
}
