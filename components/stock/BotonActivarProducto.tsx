"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";

export function BotonActivarProducto({ id, activo }: { id: string; activo: boolean }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function alternar() {
    setEnviando(true);
    setError(null);
    const supabase = crearClienteNavegador();
    const { error: errorGuardado } = await supabase
      .from("productos")
      .update({ activo: !activo })
      .eq("id", id);
    setEnviando(false);
    if (errorGuardado) {
      setError(errorGuardado.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={alternar}
        disabled={enviando}
        className="h-11 rounded-radio border border-borde px-4 text-sm font-medium text-texto-suave hover:bg-superficie-alt disabled:opacity-50"
      >
        {activo ? "Desactivar producto" : "Reactivar producto"}
      </button>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
