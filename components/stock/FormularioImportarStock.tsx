"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Reporte {
  creados: number;
  actualizados: number;
  conIngreso: number;
  errores: { fila: number; mensaje: string }[];
}

export function FormularioImportarStock() {
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporte, setReporte] = useState<Reporte | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) return;

    setEnviando(true);
    setError(null);
    setReporte(null);

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
      const res = await fetch("/api/stock/importar", { method: "POST", body: formData });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "No se pudo importar el archivo");
        return;
      }

      setReporte(body);
      router.refresh();
    } catch {
      setError("No se pudo conectar. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <div className="flex flex-col gap-1 rounded-radio border border-borde bg-superficie-alt p-4 text-sm text-texto">
        <p>
          Se usa la columna <strong>Código de barras</strong> para saber si un producto ya existe: si coincide con
          uno cargado, se actualiza; si no, se crea uno nuevo. La columna{" "}
          <strong>Cantidad a ingresar</strong> suma stock (queda registrado como un ingreso).
        </p>
        <a href="/api/exportar/stock" className="font-medium text-acento underline">
          Descargar plantilla (stock actual)
        </a>
      </div>

      <form onSubmit={enviar} className="flex flex-col gap-3">
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          className="text-sm text-texto"
        />

        {error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!archivo || enviando}
          className="h-11 self-start rounded-radio bg-acento px-6 text-sm font-medium text-acento-texto disabled:opacity-60"
        >
          {enviando ? "Importando…" : "Importar"}
        </button>
      </form>

      {reporte && (
        <div className="flex flex-col gap-2 rounded-radio border border-borde bg-superficie p-4 text-sm">
          <p className="text-texto">
            {reporte.creados} producto(s) nuevo(s), {reporte.actualizados} actualizado(s),{" "}
            {reporte.conIngreso} con ingreso de stock cargado.
          </p>
          {reporte.errores.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-error">
                {reporte.errores.length} fila(s) con problemas:
              </span>
              <ul className="flex flex-col gap-0.5 text-xs text-error">
                {reporte.errores.map((e, i) => (
                  <li key={i}>
                    Fila {e.fila}: {e.mensaje}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
