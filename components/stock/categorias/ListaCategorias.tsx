"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { FormularioCategoria } from "@/components/stock/categorias/FormularioCategoria";

interface Categoria {
  id: string;
  nombre: string;
  orden: number;
}

export function ListaCategorias({ categoriasIniciales }: { categoriasIniciales: Categoria[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function actualizar(id: string, cambios: { nombre?: string; orden?: number }) {
    setError(null);
    const supabase = crearClienteNavegador();
    const { error: errorUpdate } = await supabase.from("categorias").update(cambios).eq("id", id);
    if (errorUpdate) {
      setError(errorUpdate.message);
      return;
    }
    router.refresh();
  }

  async function eliminar(id: string) {
    setError(null);
    const supabase = crearClienteNavegador();
    const { error: errorDelete } = await supabase.from("categorias").delete().eq("id", id);
    if (errorDelete) {
      setError("No se puede borrar: hay productos que usan esta categoría. Editala o dejala como está.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <FormularioCategoria onCreada={() => router.refresh()} />

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {categoriasIniciales.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-2 rounded-radio border border-borde bg-superficie p-2"
          >
            <input
              defaultValue={c.nombre}
              onBlur={(e) => {
                const valor = e.target.value.trim();
                if (valor && valor !== c.nombre) actualizar(c.id, { nombre: valor });
              }}
              className="h-11 flex-1 rounded-radio-chico border border-borde bg-fondo px-3 text-sm text-texto"
            />
            <input
              type="number"
              defaultValue={c.orden}
              onBlur={(e) => {
                const valor = Number(e.target.value);
                if (!Number.isNaN(valor) && valor !== c.orden) actualizar(c.id, { orden: valor });
              }}
              className="h-11 w-20 rounded-radio-chico border border-borde bg-fondo px-2 text-center text-sm text-texto font-numeros"
            />
            <button
              onClick={() => eliminar(c.id)}
              className="h-11 rounded-radio-chico border border-borde px-3 text-sm text-texto-suave hover:bg-superficie-alt"
            >
              Borrar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
