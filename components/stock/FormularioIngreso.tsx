"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { useLectorCodigoBarras } from "@/lib/hooks/useLectorCodigoBarras";
import { mensajeAmigable } from "@/lib/errores/mensajeAmigable";

interface Producto {
  id: string;
  nombre: string;
  codigo_barras: string | null;
}

interface Linea {
  producto: Producto;
  cantidad: string;
}

export function FormularioIngreso({ productos }: { productos: Producto[] }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const resultados = useMemo(() => {
    const texto_ = texto.trim().toLowerCase();
    if (texto_.length === 0) return [];
    return productos
      .filter(
        (p) => p.nombre.toLowerCase().includes(texto_) || (p.codigo_barras ?? "").includes(texto_)
      )
      .slice(0, 8);
  }, [productos, texto]);

  function agregar(producto: Producto) {
    setTexto("");
    setLineas((actual) => {
      if (actual.some((l) => l.producto.id === producto.id)) return actual;
      return [...actual, { producto, cantidad: "1" }];
    });
  }

  useLectorCodigoBarras((codigo) => {
    const encontrado = productos.find((p) => p.codigo_barras === codigo);
    if (encontrado) agregar(encontrado);
  });

  function cambiarCantidad(id: string, cantidad: string) {
    setLineas((actual) => actual.map((l) => (l.producto.id === id ? { ...l, cantidad } : l)));
  }

  function quitar(id: string) {
    setLineas((actual) => actual.filter((l) => l.producto.id !== id));
  }

  async function confirmar() {
    setError(null);

    if (lineas.length === 0) {
      setError("Agregá al menos un producto");
      return;
    }
    if (!motivo.trim()) {
      setError("El motivo es obligatorio");
      return;
    }
    if (lineas.some((l) => !l.cantidad || Number(l.cantidad) <= 0)) {
      setError("Todas las cantidades deben ser mayores a cero");
      return;
    }

    setEnviando(true);
    const supabase = crearClienteNavegador();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: errorInsert } = await supabase.from("movimientos_stock").insert(
      lineas.map((l) => ({
        producto_id: l.producto.id,
        cantidad: Math.round(Number(l.cantidad)),
        tipo: "ingreso" as const,
        motivo: motivo.trim(),
        usuario_id: user!.id,
      }))
    );

    setEnviando(false);

    if (errorInsert) {
      setError(mensajeAmigable(errorInsert));
      return;
    }

    router.push("/stock");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
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
                onClick={() => agregar(p)}
                className="flex h-11 items-center px-3 text-left text-sm text-texto hover:bg-superficie-alt"
              >
                {p.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {lineas.length === 0 && (
          <p className="text-sm text-texto-suave">Todavía no agregaste productos.</p>
        )}
        {lineas.map((l) => (
          <div
            key={l.producto.id}
            className="flex items-center gap-2 rounded-radio border border-borde bg-superficie p-2"
          >
            <span className="flex-1 text-sm text-texto">{l.producto.nombre}</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={l.cantidad}
              onChange={(e) => cambiarCantidad(l.producto.id, e.target.value)}
              className="h-11 w-20 rounded-radio-chico border border-borde bg-fondo px-2 text-center text-sm text-texto font-numeros"
            />
            <button
              type="button"
              onClick={() => quitar(l.producto.id)}
              className="h-11 px-2 text-sm text-texto-suave"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-texto">Motivo</label>
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: compra a proveedor X"
          className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
        />
      </div>

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={confirmar}
        disabled={enviando}
        className="h-11 self-start rounded-radio bg-acento px-6 text-sm font-medium text-acento-texto disabled:opacity-60"
      >
        {enviando ? "Guardando…" : "Confirmar ingreso"}
      </button>
    </div>
  );
}
