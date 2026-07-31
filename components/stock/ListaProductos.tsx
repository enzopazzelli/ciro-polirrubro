"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BuscadorProductos } from "@/components/stock/BuscadorProductos";
import { IndicadorStock } from "@/components/stock/IndicadorStock";
import { useLectorCodigoBarras } from "@/lib/hooks/useLectorCodigoBarras";
import type { Rol } from "@/types/database";

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
  const [texto, setTexto] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [mostrarDesactivados, setMostrarDesactivados] = useState(false);
  const [avisoCodigoNoEncontrado, setAvisoCodigoNoEncontrado] = useState<string | null>(null);

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
          <Link
            href="/stock/nuevo"
            className="flex h-11 items-center rounded-radio bg-acento px-4 text-sm font-medium text-acento-texto"
          >
            Nuevo producto
          </Link>
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
          <Link
            href={`/stock/nuevo?codigo=${encodeURIComponent(avisoCodigoNoEncontrado)}`}
            className="font-medium underline"
          >
            Cargar este producto
          </Link>
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
            className="flex flex-col gap-2 rounded-radio border border-borde bg-superficie px-3 py-[var(--fila-py)] hover:bg-superficie-alt sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-medium text-texto">
                {p.nombre}
                {!p.activo && (
                  <span className="rounded-radio-chico bg-error-suave px-2 py-0.5 text-xs font-medium text-error">
                    Desactivado
                  </span>
                )}
              </span>
              <span className="text-xs text-texto-suave">
                {p.categoria_id ? nombrePorCategoria.get(p.categoria_id) : "Sin categoría"}
                {p.marca ? ` · ${p.marca}` : ""}
                {p.codigo_barras ? ` · ${p.codigo_barras}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-numeros text-sm text-texto">${p.precio_venta}</span>
              <IndicadorStock stockActual={p.stock_actual} stockMinimo={p.stock_minimo} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
