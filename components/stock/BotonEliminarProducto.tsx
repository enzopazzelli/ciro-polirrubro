"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { mensajeAmigable } from "@/lib/errores/mensajeAmigable";

export function BotonEliminarProducto({ id }: { id: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function eliminar() {
    setEnviando(true);
    setError(null);
    const supabase = crearClienteNavegador();
    const { error: errorRpc } = await supabase.rpc("eliminar_producto", { p_id: id });
    setEnviando(false);

    if (errorRpc) {
      setError(mensajeAmigable(errorRpc));
      return;
    }

    router.push("/stock");
    router.refresh();
  }

  if (!confirmando) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="h-11 self-start rounded-radio border border-error px-4 text-sm font-medium text-error"
        >
          Eliminar producto
        </button>
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-radio border border-error bg-error-suave p-4">
      <p className="text-sm text-texto">
        Esto borra el producto por completo, no se puede deshacer. Si tiene ventas o movimientos de stock
        cargados, no se va a poder — en ese caso desactivalo en vez de eliminarlo.
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
          onClick={eliminar}
          disabled={enviando}
          className="h-11 flex-1 rounded-radio border border-error bg-fondo text-sm font-medium text-error disabled:opacity-60"
        >
          {enviando ? "Eliminando…" : "Sí, eliminar"}
        </button>
      </div>
    </div>
  );
}
