"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { mensajeAmigable } from "@/lib/errores/mensajeAmigable";

export function BotonAnularVenta({ ventaId }: { ventaId: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function anular() {
    setEnviando(true);
    setError(null);

    const supabase = crearClienteNavegador();
    const { error: errorRpc } = await supabase.rpc("anular_venta", { p_venta_id: ventaId });

    setEnviando(false);

    if (errorRpc) {
      setError(mensajeAmigable(errorRpc));
      return;
    }

    router.refresh();
  }

  if (!confirmando) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="h-11 self-start rounded-radio border border-error px-5 text-sm font-medium text-error"
        >
          Anular venta
        </button>
        {error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-radio border border-error bg-error-suave p-4">
      <p className="text-sm text-texto">
        Se devuelve el stock vendido y, si correspondía, se revierte la cuenta corriente y el
        efectivo en caja. Esto no se puede deshacer.
      </p>
      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="h-11 flex-1 rounded-radio border border-borde bg-fondo text-sm text-texto"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={anular}
          disabled={enviando}
          className="h-11 flex-1 rounded-radio border border-error bg-fondo text-sm font-medium text-error disabled:opacity-60"
        >
          {enviando ? "Anulando…" : "Sí, anular"}
        </button>
      </div>
    </div>
  );
}
