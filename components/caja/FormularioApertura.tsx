"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";

export function FormularioApertura() {
  const router = useRouter();
  const [monto, setMonto] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function abrir(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const supabase = crearClienteNavegador();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: errorInsert } = await supabase.from("cajas").insert({
      abierta_en: new Date().toISOString(),
      monto_apertura: Math.max(Math.round(Number(monto || "0")), 0),
      estado: "abierta",
      usuario_apertura_id: user!.id,
    });

    setEnviando(false);

    if (errorInsert) {
      setError(errorInsert.message);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={abrir} className="flex flex-col gap-4 max-w-sm">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-texto">Monto inicial</label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto font-numeros"
        />
      </div>

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="h-14 w-full rounded-radio bg-acento text-base font-semibold text-acento-texto disabled:opacity-60"
      >
        {enviando ? "Abriendo…" : "Abrir caja"}
      </button>
    </form>
  );
}
