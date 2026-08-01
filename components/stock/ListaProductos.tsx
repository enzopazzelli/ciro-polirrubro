"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BuscadorProductos } from "@/components/stock/BuscadorProductos";
import { IndicadorStock } from "@/components/stock/IndicadorStock";
import { ModalNuevoProducto } from "@/components/stock/ModalNuevoProducto";
import { useLectorCodigoBarras } from "@/lib/hooks/useLectorCodigoBarras";
import { calcularEstadoStock } from "@/lib/productos/estadoStock";
import type { Rol } from "@/types/database";

const COLOR_PUNTO: Record<ReturnType<typeof calcularEstadoStock>, string> = {
  normal: "bg-ok",
  bajo: "bg-alerta",
  agotado: "bg-error",
};

interface Producto {
  id: string;
  nombre: string;
  marca: string | null;
  codigo_barras: string | null;
  categoria_id: string | null;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
}

interface Categoria {
  id: string;
  nombre: string;
}

export function ListaProductos({
  productos,
  categorias,
  rol,
  puedeGestionarStock,
}: {
  productos: Producto[];
  categorias: Categoria[];
  rol: Rol;
  puedeGestionarStock: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [texto, setTexto] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [mostrarDesactivados, setMostrarDesactivados] = useState(false);
  const [avisoCodigoNoEncontrado, setAvisoCodigoNoEncontrado] = useState<string | null>(null);
  // Entrada cruzada desde /ventas ("código no encontrado, cargar este
  // producto") o desde un link directo: ?nuevo=1&codigo=X abre el
  // modal ya al llegar a /stock, en vez de depender de una página
  // /stock/nuevo aparte. Se calcula acá (no en un efecto) para que el
  // modal ya salga abierto en el primer render, sin un render extra.
  const [modalNuevoProducto, setModalNuevoProducto] = useState<{ codigoInicial?: string } | null>(() =>
    searchParams.get("nuevo") === "1" ? { codigoInicial: searchParams.get("codigo") ?? undefined } : null
  );

  // Limpia la URL después de leerla, sin tocar el estado del modal (ya
  // se calculó arriba).
  useEffect(() => {
    if (searchParams.get("nuevo") === "1") {
      router.replace("/stock");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nombrePorCategoria = useMemo(
    () => new Map(categorias.map((c) => [c.id, c.nombre])),
    [categorias]
  );

  const filtrados = useMemo(() => {
    const texto_ = texto.trim().toLowerCase();
    return productos.filter((p) => {
      if (!mostrarDesactivados && !p.activo) return false;
      const coincideTexto =
        texto_.length === 0 ||
        p.nombre.toLowerCase().includes(texto_) ||
        (p.marca ?? "").toLowerCase().includes(texto_) ||
        (p.codigo_barras ?? "").includes(texto_);
      const coincideCategoria = !categoriaId || p.categoria_id === categoriaId;
      return coincideTexto && coincideCategoria;
    });
  }, [productos, texto, categoriaId, mostrarDesactivados]);

  useLectorCodigoBarras((codigo) => {
    setAvisoCodigoNoEncontrado(null);
    const encontrado = productos.find((p) => p.codigo_barras === codigo);
    if (encontrado) {
      router.push(`/stock/${encontrado.id}`);
    } else {
      setAvisoCodigoNoEncontrado(codigo);
    }
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-texto">Stock</h1>
        <div className="flex flex-wrap gap-2">
          {puedeGestionarStock && (
            <>
              <Link
                href="/stock/ingreso"
                className="flex h-11 items-center rounded-radio border border-borde px-4 text-sm font-medium text-texto hover:bg-superficie-alt"
              >
                Ingreso de mercadería
              </Link>
              <Link
                href="/stock/ajuste"
                className="flex h-11 items-center rounded-radio border border-borde px-4 text-sm font-medium text-texto hover:bg-superficie-alt"
              >
                Ajustar stock
              </Link>
              <Link
                href="/stock/importar"
                className="flex h-11 items-center rounded-radio border border-borde px-4 text-sm font-medium text-texto hover:bg-superficie-alt"
              >
                Importar Excel
              </Link>
            </>
          )}
          {rol === "admin" && (
            <Link
              href="/stock/categorias"
              className="flex h-11 items-center rounded-radio border border-borde px-4 text-sm font-medium text-texto hover:bg-superficie-alt"
            >
              Categorías
            </Link>
          )}
          <a
            href="/api/exportar/stock"
            className="flex h-11 items-center rounded-radio border border-borde px-4 text-sm font-medium text-texto hover:bg-superficie-alt"
          >
            Exportar Excel
          </a>
          <button
            type="button"
            onClick={() => setModalNuevoProducto({})}
            className="flex h-11 items-center rounded-radio bg-acento px-4 text-sm font-medium text-acento-texto"
          >
            Nuevo producto
          </button>
        </div>
      </div>

      <BuscadorProductos
        texto={texto}
        onTextoChange={setTexto}
        categoriaId={categoriaId}
        onCategoriaChange={setCategoriaId}
        categorias={categorias}
      />

      <label className="flex items-center gap-2 text-sm text-texto-suave">
        <input
          type="checkbox"
          checked={mostrarDesactivados}
          onChange={(e) => setMostrarDesactivados(e.target.checked)}
          className="h-4 w-4"
        />
        Mostrar desactivados
      </label>

      {avisoCodigoNoEncontrado && (
        <div className="flex items-center justify-between gap-3 rounded-radio bg-alerta-suave px-4 py-3 text-sm text-alerta">
          <span>Código {avisoCodigoNoEncontrado} no encontrado.</span>
          <button
            type="button"
            onClick={() => setModalNuevoProducto({ codigoInicial: avisoCodigoNoEncontrado })}
            className="font-medium underline"
          >
            Cargar este producto
          </button>
        </div>
      )}

      <div className="flex flex-col gap-[var(--fila-gap)]">
        {filtrados.length === 0 && (
          <p className="text-sm text-texto-suave">No hay productos que coincidan.</p>
        )}
        {filtrados.map((p) => (
          <Link
            key={p.id}
            href={`/stock/${p.id}`}
            className="flex flex-col gap-2 rounded-radio border border-borde bg-superficie px-3 py-[var(--fila-py)] transition-shadow hover:border-acento/30 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-medium text-texto">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${COLOR_PUNTO[calcularEstadoStock(p.stock_actual, p.stock_minimo)]}`}
                  aria-hidden
                />
                {p.nombre}
                {!p.activo && (
                  <span className="rounded-radio-chico bg-error-suave px-2 py-0.5 text-xs font-medium text-error">
                    Desactivado
                  </span>
                )}
              </span>
              <span className="pl-4 text-xs text-texto-suave">
                <span className="rounded-full bg-acento-suave px-2 py-0.5 text-acento">
                  {p.categoria_id ? nombrePorCategoria.get(p.categoria_id) : "Sin categoría"}
                </span>
                {p.marca ? ` · ${p.marca}` : ""}
                {p.codigo_barras ? ` · ${p.codigo_barras}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3 pl-4 sm:pl-0">
              <span className="font-numeros text-sm font-semibold text-texto">${p.precio_venta}</span>
              <IndicadorStock stockActual={p.stock_actual} stockMinimo={p.stock_minimo} />
            </div>
          </Link>
        ))}
      </div>

      {modalNuevoProducto && (
        <ModalNuevoProducto
          categorias={categorias}
          rol={rol}
          codigoInicial={modalNuevoProducto.codigoInicial}
          onCerrar={() => setModalNuevoProducto(null)}
        />
      )}
    </div>
  );
}
