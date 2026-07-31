"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { mensajeAmigable } from "@/lib/errores/mensajeAmigable";

export function FormularioCierre({ cajaId, calculado }: { cajaId: string; calculado: number }) {
  const router = useRouter();
  const [declarado, setDeclarado] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const montoDeclarado = Math.round(Number(declarado || "0"));
  const diferencia = montoDeclarado - calculado;

  async function cerrar() {
    setError(null);
    setEnviando(true);

    const supabase = crearClienteNavegador();
    const { error: errorRpc } = await supabase.rpc("cerrar_caja", {
      p_caja_id: cajaId,
      p_monto_declarado: montoDeclarado,
    });

    setEnviando(false);

    if (errorRpc) {
      setError(mensajeAmigable(errorRpc));
      return;
    }

    router.refresh();
  }

  if (!confirmando) {
    return (
      <div className="flex flex-col gap-3 rounded-radio border border-borde bg-superficie p-4">
        <h3 className="text-sm font-semibold text-texto">Cerrar caja</h3>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-texto">Monto declarado (lo que contaste)</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={declarado}
            onChange={(e) => setDeclarado(e.target.value)}
            className="h-11 max-w-[200px] rounded-radio border border-borde bg-fondo px-3 text-sm text-texto font-numeros"
          />
        </div>
        {declarado !== "" && (
          <p className={`text-sm font-numeros ${diferencia === 0 ? "text-ok" : "text-alerta"}`}>
            Diferencia: {diferencia > 0 ? "+" : ""}
            {diferencia}
          </p>
        )}
        <button
          type="button"
          disabled={declarado === ""}
          onClick={() => setConfirmando(true)}
          className="h-11 self-start rounded-radio bg-acento px-6 text-sm font-medium text-acento-texto disabled:opacity-40"
        >
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-radio border border-error bg-error-suave p-4">
      <p className="text-sm text-texto">
        Una vez cerrada, esta caja no se puede volver a modificar. Declarado: <strong>${montoDeclarado}</strong>,
        calculado: <strong>${calculado}</strong>, diferencia: <strong>{diferencia > 0 ? "+" : ""}{diferencia}</strong>.
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
          onClick={cerrar}
          disabled={enviando}
          className="h-11 flex-1 rounded-radio border border-error bg-fondo text-sm font-medium text-error disabled:opacity-60"
        >
          {enviando ? "Cerrando…" : "Confirmar cierre"}
        </button>
      </div>
    </div>
  );
}
