"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { useLectorCodigoBarras } from "@/lib/hooks/useLectorCodigoBarras";
import { mensajeAmigable } from "@/lib/errores/mensajeAmigable";
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
  marca: string | null;
}

export function FormularioProducto({
  producto,
  categorias,
  rol,
  puedeVerCosto = false,
  codigoInicial,
  onExito,
  onCancelar,
}: {
  producto?: ProductoExistente;
  categorias: Categoria[];
  rol: Rol;
  puedeVerCosto?: boolean;
  codigoInicial?: string;
  /** Si se pasa, se llama en vez de navegar a /stock (uso desde un modal). */
  onExito?: () => void;
  /** Si se pasa, "Cancelar" llama a esto en vez de ser un link a /stock. */
  onCancelar?: () => void;
}) {
  const router = useRouter();
  const esEdicion = !!producto;

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [marca, setMarca] = useState(producto?.marca ?? "");
  const [codigoBarras, setCodigoBarras] = useState(producto?.codigo_barras ?? codigoInicial ?? "");
  const [categoriaId, setCategoriaId] = useState(producto?.categoria_id ?? "");
  const [categoriasLocales, setCategoriasLocales] = useState(categorias);
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);
  const [nombreNuevaCategoria, setNombreNuevaCategoria] = useState("");
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [errorCategoria, setErrorCategoria] = useState<string | null>(null);
  const [precioVenta, setPrecioVenta] = useState(producto?.precio_venta?.toString() ?? "");
  const [precioCosto, setPrecioCosto] = useState(producto?.precio_costo?.toString() ?? "");
  const [stockMinimo, setStockMinimo] = useState(producto?.stock_minimo?.toString() ?? "5");
  const [error, setError] = useState<string | null>(null);
  const [productoEnConflicto, setProductoEnConflicto] = useState<{ id: string; nombre: string } | null>(
    null
  );
  const [enviando, setEnviando] = useState(false);

  async function crearCategoria() {
    if (!nombreNuevaCategoria.trim()) return;
    setCreandoCategoria(true);
    setErrorCategoria(null);

    const supabase = crearClienteNavegador();
    const { data, error: errorInsert } = await supabase
      .from("categorias")
      .insert({ nombre: nombreNuevaCategoria.trim() })
      .select("id, nombre")
      .single();

    setCreandoCategoria(false);

    if (errorInsert || !data) {
      setErrorCategoria(mensajeAmigable(errorInsert));
      return;
    }

    setCategoriasLocales((actual) => [...actual, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setCategoriaId(data.id);
    setNombreNuevaCategoria("");
    setMostrarNuevaCategoria(false);
  }

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

    const codigoBarrasLimpio = codigoBarras.trim() || null;
    const marcaLimpia = marca.trim() || null;
    const categoriaIdLimpia = categoriaId || null;
    const precioVentaNumero = Math.round(Number(precioVenta));
    const precioCostoNumero =
      rol === "admin" && precioCosto.trim() !== "" ? Math.round(Number(precioCosto)) : null;
    const stockMinimoNumero = Math.round(Number(stockMinimo || "0"));

    // La edición pasa por una función (no un UPDATE directo a la
    // tabla): la operadora con editar_precio_venta no tiene SELECT
    // sobre productos (solo sobre la vista, que enmascara
    // precio_costo), y sin poder "ver" la fila Postgres no la deja
    // actualizar aunque la política de UPDATE lo permita.
    const { error: errorGuardado } = esEdicion
      ? await supabase.rpc("actualizar_producto", {
          p_id: producto!.id,
          p_nombre: nombre.trim(),
          p_marca: marcaLimpia,
          p_codigo_barras: codigoBarrasLimpio,
          p_categoria_id: categoriaIdLimpia,
          p_precio_venta: precioVentaNumero,
          p_precio_costo: precioCostoNumero,
          p_stock_minimo: stockMinimoNumero,
        })
      : await supabase.from("productos").insert({
          nombre: nombre.trim(),
          marca: marcaLimpia,
          codigo_barras: codigoBarrasLimpio,
          categoria_id: categoriaIdLimpia,
          precio_venta: precioVentaNumero,
          precio_costo: precioCostoNumero,
          stock_minimo: stockMinimoNumero,
        });

    setEnviando(false);

    if (errorGuardado) {
      if (errorGuardado.code === "23505" && codigoBarrasLimpio) {
        const { data: conflicto } = await supabase
          .from("productos_lista")
          .select("id, nombre")
          .eq("codigo_barras", codigoBarrasLimpio)
          .maybeSingle();

        setProductoEnConflicto(conflicto ?? null);
        setError(`El código de barras ${codigoBarrasLimpio} ya está en uso`);
      } else {
        setError(mensajeAmigable(errorGuardado));
      }
      return;
    }

    if (onExito) {
      onExito();
    } else {
      router.push("/stock");
    }
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
        <label className="text-sm font-medium text-texto">Marca</label>
        <input
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
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
        <div className="flex gap-2">
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="h-11 flex-1 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
          >
            <option value="">Sin categoría</option>
            {categoriasLocales.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {rol === "admin" && !mostrarNuevaCategoria && (
            <button
              type="button"
              onClick={() => setMostrarNuevaCategoria(true)}
              className="h-11 shrink-0 rounded-radio border border-borde px-4 text-sm font-medium text-texto hover:bg-superficie-alt"
            >
              + Nueva
            </button>
          )}
        </div>

        {mostrarNuevaCategoria && (
          <div className="flex flex-col gap-1.5 rounded-radio border border-borde bg-superficie-alt p-3">
            <div className="flex gap-2">
              <input
                value={nombreNuevaCategoria}
                onChange={(e) => setNombreNuevaCategoria(e.target.value)}
                placeholder="Nombre de la categoría"
                className="h-11 flex-1 rounded-radio-chico border border-borde bg-fondo px-3 text-sm text-texto"
              />
              <button
                type="button"
                onClick={crearCategoria}
                disabled={creandoCategoria || !nombreNuevaCategoria.trim()}
                className="h-11 rounded-radio-chico bg-acento px-4 text-sm font-medium text-acento-texto disabled:opacity-60"
              >
                {creandoCategoria ? "Creando…" : "Crear"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarNuevaCategoria(false);
                  setNombreNuevaCategoria("");
                  setErrorCategoria(null);
                }}
                className="h-11 rounded-radio-chico border border-borde px-3 text-sm text-texto-suave"
              >
                Cancelar
              </button>
            </div>
            {errorCategoria && (
              <p className="text-sm text-error" role="alert">
                {errorCategoria}
              </p>
            )}
          </div>
        )}
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

        {rol === "admin" ? (
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
        ) : (
          puedeVerCosto &&
          producto?.precio_costo != null && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-texto">Precio de costo</span>
              <p className="h-11 flex items-center text-sm font-numeros text-texto-suave">
                ${producto.precio_costo}
                {producto.precio_venta > 0 && (
                  <span className="ml-2 text-xs">
                    (margen: {Math.round(((producto.precio_venta - producto.precio_costo) / producto.precio_venta) * 100)}%)
                  </span>
                )}
              </p>
            </div>
          )
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="h-11 self-start rounded-radio bg-acento px-6 text-sm font-medium text-acento-texto disabled:opacity-60"
        >
          {enviando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear producto"}
        </button>
        {onCancelar ? (
          <button
            type="button"
            onClick={onCancelar}
            className="h-11 rounded-radio border border-borde px-6 text-sm font-medium text-texto hover:bg-superficie-alt"
          >
            Cancelar
          </button>
        ) : (
          <Link
            href="/stock"
            className="h-11 flex items-center rounded-radio border border-borde px-6 text-sm font-medium text-texto hover:bg-superficie-alt"
          >
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
