"use client";

import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";

export function FormularioCategoria({ onCreada }: { onCreada: () => void }) {
  const [nombre, setNombre] = useState("");
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
    const { error: errorInsert } = await supabase.from("categorias").insert({ nombre: nombre.trim() });
    setEnviando(false);

    if (errorInsert) {
      setError(errorInsert.message);
      return;
    }

    setNombre("");
    onCreada();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nueva categoría"
          className="h-11 flex-1 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
        />
        <button
          type="submit"
          disabled={enviando}
          className="h-11 rounded-radio bg-acento px-5 text-sm font-medium text-acento-texto disabled:opacity-60"
        >
          Agregar
        </button>
      </div>
      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
