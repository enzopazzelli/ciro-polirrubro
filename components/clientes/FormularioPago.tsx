"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { mensajeAmigable } from "@/lib/errores/mensajeAmigable";

export function FormularioPago({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const montoNumero = Math.round(Number(monto));
    if (!monto || montoNumero <= 0) {
      setError("Ingresá un monto mayor a cero");
      return;
    }

    setEnviando(true);
    const supabase = crearClienteNavegador();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: errorInsert } = await supabase.from("movimientos_cuenta").insert({
      cliente_id: clienteId,
      monto: -montoNumero,
      tipo: "pago",
      usuario_id: user!.id,
    });

    setEnviando(false);

    if (errorInsert) {
      setError(mensajeAmigable(errorInsert));
      return;
    }

    setMonto("");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex items-end gap-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-texto">Registrar pago</label>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Monto"
          className="h-11 w-40 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto font-numeros"
        />
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="h-11 rounded-radio bg-acento px-5 text-sm font-medium text-acento-texto disabled:opacity-60"
      >
        {enviando ? "Guardando…" : "Confirmar pago"}
      </button>
      {error && (
        <p className="text-sm text-error self-center" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
