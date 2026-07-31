"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";

interface Gasto {
  id: string;
  concepto: string;
  monto: number;
}

export function FormularioGasto({ cajaId, gastosDeHoy }: { cajaId: string; gastosDeHoy: Gasto[] }) {
  const router = useRouter();
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const montoNumero = Math.round(Number(monto));
    if (!concepto.trim()) {
      setError("El concepto es obligatorio");
      return;
    }
    if (!monto || montoNumero <= 0) {
      setError("Ingresá un monto mayor a cero");
      return;
    }

    setEnviando(true);
    const supabase = crearClienteNavegador();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: errorInsert } = await supabase.from("movimientos_caja").insert({
      caja_id: cajaId,
      tipo: "egreso",
      concepto: concepto.trim(),
      monto: montoNumero,
      usuario_id: user!.id,
    });

    setEnviando(false);

    if (errorInsert) {
      setError(errorInsert.message);
      return;
    }

    setConcepto("");
    setMonto("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={registrar} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium text-texto">Concepto</label>
          <input
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej: pago de flete"
            className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-texto">Monto</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="h-11 w-32 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto font-numeros"
          />
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="h-11 rounded-radio bg-acento px-5 text-sm font-medium text-acento-texto disabled:opacity-60"
        >
          Registrar gasto
        </button>
      </form>

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {gastosDeHoy.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-texto-suave">Gastos de esta caja</span>
          {gastosDeHoy.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between rounded-radio-chico border border-borde px-3 py-2 text-sm"
            >
              <span className="text-texto">{g.concepto}</span>
              <span className="font-numeros text-error">${g.monto}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
