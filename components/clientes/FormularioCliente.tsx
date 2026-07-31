"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { mensajeAmigable } from "@/lib/errores/mensajeAmigable";

interface ClienteExistente {
  id: string;
  nombre: string;
  telefono: string | null;
  limite_credito: number;
  direccion: string | null;
  notas: string | null;
}

export function FormularioCliente({
  cliente,
  puedeEditarLimite,
}: {
  cliente?: ClienteExistente;
  puedeEditarLimite: boolean;
}) {
  const router = useRouter();
  const esEdicion = !!cliente;

  const [nombre, setNombre] = useState(cliente?.nombre ?? "");
  const [telefono, setTelefono] = useState(cliente?.telefono ?? "");
  const [direccion, setDireccion] = useState(cliente?.direccion ?? "");
  const [notas, setNotas] = useState(cliente?.notas ?? "");
  const [limiteCredito, setLimiteCredito] = useState(cliente?.limite_credito?.toString() ?? "0");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setEnviando(true);
    const supabase = crearClienteNavegador();

    const payload: {
      nombre: string;
      telefono: string | null;
      direccion: string | null;
      notas: string | null;
      limite_credito?: number;
    } = {
      nombre: nombre.trim(),
      telefono: telefono.trim() || null,
      direccion: direccion.trim() || null,
      notas: notas.trim() || null,
    };
    if (puedeEditarLimite) {
      payload.limite_credito = Math.round(Number(limiteCredito || "0"));
    }

    const { error: errorGuardado } = esEdicion
      ? await supabase.from("clientes").update(payload).eq("id", cliente!.id)
      : await supabase.from("clientes").insert(payload);

    setEnviando(false);

    if (errorGuardado) {
      setError(mensajeAmigable(errorGuardado));
      return;
    }

    router.push(esEdicion ? `/clientes/${cliente!.id}` : "/clientes");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4 max-w-lg">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-texto">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-texto">Teléfono</label>
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-texto">Dirección</label>
        <input
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-texto">Notas</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          placeholder="Ej: referencias, preferencias, horarios de pago…"
          className="rounded-radio border border-borde bg-superficie px-3 py-2 text-sm text-texto"
        />
      </div>

      {puedeEditarLimite && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-texto">Límite de crédito</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={limiteCredito}
            onChange={(e) => setLimiteCredito(e.target.value)}
            className="h-11 max-w-[200px] rounded-radio border border-borde bg-superficie px-3 text-sm text-texto font-numeros"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="h-11 self-start rounded-radio bg-acento px-6 text-sm font-medium text-acento-texto disabled:opacity-60"
      >
        {enviando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear cliente"}
      </button>
    </form>
  );
}
