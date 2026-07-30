"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { useLectorCodigoBarras } from "@/lib/hooks/useLectorCodigoBarras";
import type { Rol } from "@/types/database";

interface Categoria {
  id: string;
  nombre: string;
}

interface ProductoExistente {
  id: string;
  nombre: string;
  codigo_barras: string | null;
  categoria_id: string | null;
  precio_venta: number;
  precio_costo: number | null;
  stock_minimo: number;
}

export function FormularioProducto({
  producto,
  categorias,
  rol,
  codigoInicial,
}: {
  producto?: ProductoExistente;
  categorias: Categoria[];
  rol: Rol;
  codigoInicial?: string;
}) {
  const router = useRouter();
  const esEdicion = !!producto;

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [codigoBarras, setCodigoBarras] = useState(producto?.codigo_barras ?? codigoInicial ?? "");
  const [categoriaId, setCategoriaId] = useState(producto?.categoria_id ?? "");
  const [precioVenta, setPrecioVenta] = useState(producto?.precio_venta?.toString() ?? "");
  const [precioCosto, setPrecioCosto] = useState(producto?.precio_costo?.toString() ?? "");
  const [stockMinimo, setStockMinimo] = useState(producto?.stock_minimo?.toString() ?? "5");
  const [error, setError] = useState<string | null>(null);
  const [productoEnConflicto, setProductoEnConflicto] = useState<{ id: string; nombre: string } | null>(
    null
  );
  const [enviando, setEnviando] = useState(false);

  useLectorCodigoBarras((codigo) => setCodigoBarras(codigo));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setProductoEnConflicto(null);

    if (!nombre.trim() || precioVenta.trim() === "") {
      setError("Nombre y precio de venta son obligatorios");
      return;
    }

    setEnviando(true);

    const supabase = crearClienteNavegador();

    const payload = {
      nombre: nombre.trim(),
      codigo_barras: codigoBarras.trim() || null,
      categoria_id: categoriaId || null,
      precio_venta: Math.round(Number(precioVenta)),
      precio_costo: rol === "admin" && precioCosto.trim() !== "" ? Math.round(Number(precioCosto)) : null,
      stock_minimo: Math.round(Number(stockMinimo || "0")),
    };

    const { error: errorGuardado } = esEdicion
      ? await supabase.from("productos").update(payload).eq("id", producto!.id)
      : await supabase.from("productos").insert(payload);

    setEnviando(false);

    if (errorGuardado) {
      if (errorGuardado.code === "23505" && payload.codigo_barras) {
        const { data: conflicto } = await supabase
          .from("productos_lista")
          .select("id, nombre")
          .eq("codigo_barras", payload.codigo_barras)
          .maybeSingle();

        setProductoEnConflicto(conflicto ?? null);
        setError(`El código de barras ${payload.codigo_barras} ya está en uso`);
      } else {
        setError(errorGuardado.message);
      }
      return;
    }

    router.push("/stock");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4 max-w-lg">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-texto">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-texto">Código de barras</label>
        <input
          value={codigoBarras}
          onChange={(e) => setCodigoBarras(e.target.value)}
          placeholder="Escaneá o escribí el código"
          className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto font-numeros"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-texto">Categoría</label>
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
        >
          <option value="">Sin categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-texto">Precio de venta</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
            required
            className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto font-numeros"
          />
        </div>

        {rol === "admin" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-texto">Precio de costo</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={precioCosto}
              onChange={(e) => setPrecioCosto(e.target.value)}
              className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto font-numeros"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-texto">Stock mínimo (aviso de stock bajo)</label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={stockMinimo}
          onChange={(e) => setStockMinimo(e.target.value)}
          className="h-11 max-w-[160px] rounded-radio border border-borde bg-superficie px-3 text-sm text-texto font-numeros"
        />
      </div>

      {error && (
        <div className="flex flex-col gap-1 rounded-radio bg-error-suave px-3 py-2 text-sm text-error" role="alert">
          <span>{error}</span>
          {productoEnConflicto && (
            <Link href={`/stock/${productoEnConflicto.id}`} className="font-medium underline">
              Ver {productoEnConflicto.nombre}
            </Link>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="h-11 self-start rounded-radio bg-acento px-6 text-sm font-medium text-acento-texto disabled:opacity-60"
      >
        {enviando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear producto"}
      </button>
    </form>
  );
}
