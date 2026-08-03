"use client";

import { useEffect } from "react";
import { FormularioProducto } from "@/components/stock/FormularioProducto";
import type { Rol } from "@/types/database";

interface Categoria {
  id: string;
  nombre: string;
}

export function ModalNuevoProducto({
  categorias,
  rol,
  puedeGestionarStock,
  codigoInicial,
  onCerrar,
}: {
  categorias: Categoria[];
  rol: Rol;
  puedeGestionarStock: boolean;
  codigoInicial?: string;
  onCerrar: () => void;
}) {
  useEffect(() => {
    function alEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", alEscape);
    return () => window.removeEventListener("keydown", alEscape);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center sm:py-10"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-lg rounded-radio bg-superficie p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-texto">Nuevo producto</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-texto-suave hover:bg-superficie-alt"
          >
            ✕
          </button>
        </div>
        <FormularioProducto
          categorias={categorias}
          rol={rol}
          puedeGestionarStock={puedeGestionarStock}
          codigoInicial={codigoInicial}
          onExito={onCerrar}
          onCancelar={onCerrar}
        />
      </div>
    </div>
  );
}
