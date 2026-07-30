"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { useLectorCodigoBarras } from "@/lib/hooks/useLectorCodigoBarras";

interface Producto {
  id: string;
  nombre: string;
  codigo_barras: string | null;
  stock_actual: number;
}

export function FormularioAjuste({ productos }: { productos: Producto[] }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [seleccionado, setSeleccionado] = useState<Producto | null>(null);
  const [nuevoStock, setNuevoStock] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const resultados = useMemo(() => {
    const texto_ = texto.trim().toLowerCase();
    if (texto_.length === 0 || seleccionado) return [];
    return productos
      .filter(
        (p) => p.nombre.toLowerCase().includes(texto_) || (p.codigo_barras ?? "").includes(texto_)
      )
      .slice(0, 8);
  }, [productos, texto, seleccionado]);

  function seleccionar(producto: Producto) {
    setSeleccionado(producto);
    setNuevoStock(producto.stock_actual.toString());
    setTexto("");
    setError(null);
  }

  useLectorCodigoBarras((codigo) => {
    const encontrado = productos.find((p) => p.codigo_barras === codigo);
    if (encontrado) seleccionar(encontrado);
  });

  const delta = seleccionado && nuevoStock !== "" ? Math.round(Number(nuevoStock)) - seleccionado.stock_actual : 0;

  async function confirmar() {
    setError(null);

    if (!seleccionado) {
      setError("Elegí un producto");
      return;
    }
    if (!motivo.trim()) {
      setError("El motivo es obligatorio");
      return;
    }
    if (delta === 0) {
      setError("El nuevo valor es igual al stock actual");
      return;
    }

    setEnviando(true);
    const supabase = crearClienteNavegador();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: errorInsert } = await supabase.from("movimientos_stock").insert({
      producto_id: seleccionado.id,
      cantidad: delta,
      tipo: "ajuste",
      motivo: motivo.trim(),
      usuario_id: user!.id,
    });

    setEnviando(false);

    if (errorInsert) {
      setError(errorInsert.message);
      return;
    }

    router.push("/stock");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      {!seleccionado ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-texto">Buscar o escanear producto</label>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Nombre o código de barras…"
            className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
          />
          {resultados.length > 0 && (
            <div className="flex flex-col overflow-hidden rounded-radio border border-borde">
              {resultados.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => seleccionar(p)}
                  className="flex h-11 items-center justify-between px-3 text-left text-sm text-texto hover:bg-superficie-alt"
                >
                  <span>{p.nombre}</span>
                  <span className="text-texto-suave">stock: {p.stock_actual}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-radio border border-borde bg-superficie p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-texto">{seleccionado.nombre}</span>
            <button
              type="button"
              onClick={() => setSeleccionado(null)}
              className="text-sm text-texto-suave underline"
            >
              Cambiar
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-texto">
              Stock actual: {seleccionado.stock_actual}
            </label>
            <label className="text-sm font-medium text-texto">Nuevo stock</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={nuevoStock}
              onChange={(e) => setNuevoStock(e.target.value)}
              className="h-11 rounded-radio border border-borde bg-fondo px-3 text-sm text-texto font-numeros"
            />
            {delta !== 0 && (
              <span className={`text-sm font-numeros ${delta > 0 ? "text-ok" : "text-error"}`}>
                {delta > 0 ? `+${delta}` : delta}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-texto">Motivo</label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: conteo físico, rotura, vencimiento"
              className="h-11 rounded-radio border border-borde bg-fondo px-3 text-sm text-texto"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {seleccionado && (
        <button
          type="button"
          onClick={confirmar}
          disabled={enviando}
          className="h-11 self-start rounded-radio bg-acento px-6 text-sm font-medium text-acento-texto disabled:opacity-60"
        >
          {enviando ? "Guardando…" : "Confirmar ajuste"}
        </button>
      )}
    </div>
  );
}
