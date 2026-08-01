"use client";

import { useMemo, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { db, type ClienteLocal } from "@/lib/dexie/db";
import { mensajeAmigable } from "@/lib/errores/mensajeAmigable";

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
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [creando, setCreando] = useState(false);
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null);

  const resultados = useMemo(() => {
    const texto_ = texto.trim().toLowerCase();
    if (texto_.length === 0) return [];
    return clientes.filter((c) => c.activo && c.nombre.toLowerCase().includes(texto_)).slice(0, 6);
  }, [clientes, texto]);

  // Alta rápida sin salir de la venta: mismo patrón que "+ Nueva categoría"
  // en el modal de nuevo producto (Stock). clientes_insert permite a
  // cualquiera de los dos roles, así que no hace falta gatear el botón.
  async function crearCliente() {
    if (!nombreNuevo.trim()) return;
    setCreando(true);
    setErrorNuevo(null);

    const supabase = crearClienteNavegador();
    const { data, error: errorInsert } = await supabase
      .from("clientes")
      .insert({ nombre: nombreNuevo.trim() })
      .select("id, nombre, telefono, limite_credito, saldo, activo")
      .single();

    setCreando(false);

    if (errorInsert || !data) {
      setErrorNuevo(mensajeAmigable(errorInsert));
      return;
    }

    // Se agrega a Dexie a mano para poder seleccionarlo ya mismo: la
    // suscripción realtime de SincronizadorFondo también lo va a traer,
    // pero con un debounce de 500ms.
    await db.clientes.put(data);
    setNombreNuevo("");
    setMostrarNuevo(false);
    setTexto("");
    onSeleccionar(data);
  }

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
      <div className="flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar cliente por nombre…"
          className="h-11 flex-1 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
        />
        {!mostrarNuevo && (
          <button
            type="button"
            onClick={() => setMostrarNuevo(true)}
            className="h-11 shrink-0 rounded-radio border border-borde px-4 text-sm font-medium text-texto hover:bg-superficie-alt"
          >
            + Nuevo
          </button>
        )}
      </div>

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

      {mostrarNuevo && (
        <div className="flex flex-col gap-1.5 rounded-radio border border-borde bg-superficie-alt p-3">
          <div className="flex gap-2">
            <input
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder="Nombre del cliente"
              autoFocus
              className="h-11 flex-1 rounded-radio-chico border border-borde bg-fondo px-3 text-sm text-texto"
            />
            <button
              type="button"
              onClick={crearCliente}
              disabled={creando || !nombreNuevo.trim()}
              className="h-11 rounded-radio-chico bg-acento px-4 text-sm font-medium text-acento-texto disabled:opacity-60"
            >
              {creando ? "Creando…" : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarNuevo(false);
                setNombreNuevo("");
                setErrorNuevo(null);
              }}
              className="h-11 rounded-radio-chico border border-borde px-3 text-sm text-texto-suave"
            >
              Cancelar
            </button>
          </div>
          {errorNuevo && (
            <p className="text-sm text-error" role="alert">
              {errorNuevo}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
