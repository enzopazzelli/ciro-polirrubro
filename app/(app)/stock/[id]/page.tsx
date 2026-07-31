import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioProducto } from "@/components/stock/FormularioProducto";
import { BotonActivarProducto } from "@/components/stock/BotonActivarProducto";
import { IndicadorStock } from "@/components/stock/IndicadorStock";
import { HistorialMovimientos } from "@/components/stock/HistorialMovimientos";

export default async function PaginaFichaProducto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user!.id).single();
  const esAdmin = perfil!.rol === "admin";

  const columnas =
    "id, nombre, marca, codigo_barras, categoria_id, precio_venta, precio_costo, stock_actual, stock_minimo, activo";

  const { data: producto } = esAdmin
    ? await supabase.from("productos").select(columnas).eq("id", id).maybeSingle()
    : await supabase.from("productos_lista").select(columnas).eq("id", id).maybeSingle();

  if (!producto) {
    notFound();
  }

  const { data: categorias } = await supabase.from("categorias").select("id, nombre").order("orden");

  const { data: movimientos } = await supabase
    .from("movimientos_stock")
    .select("id, cantidad, tipo, motivo, creado_en, usuario_id")
    .eq("producto_id", id)
    .order("creado_en", { ascending: false });

  const idsUsuarios = [...new Set((movimientos ?? []).map((m) => m.usuario_id).filter((v): v is string => !!v))];
  const { data: perfilesUsuarios } =
    idsUsuarios.length > 0
      ? await supabase.from("perfiles").select("id, nombre").in("id", idsUsuarios)
      : { data: [] as { id: string; nombre: string }[] };

  const nombrePorUsuario = new Map((perfilesUsuarios ?? []).map((p) => [p.id, p.nombre]));

  const movimientosConNombre = (movimientos ?? []).map((m) => ({
    ...m,
    usuario_nombre: m.usuario_id ? (nombrePorUsuario.get(m.usuario_id) ?? null) : null,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-texto">{producto.nombre}</h1>
          <IndicadorStock stockActual={producto.stock_actual} stockMinimo={producto.stock_minimo} />
        </div>

        {esAdmin ? (
          <>
            <FormularioProducto producto={producto} categorias={categorias ?? []} rol="admin" />
            <BotonActivarProducto id={producto.id} activo={producto.activo} />
          </>
        ) : (
          <div className="flex flex-col gap-1 text-sm text-texto">
            <p>Marca: {producto.marca ?? "—"}</p>
            <p>Código de barras: {producto.codigo_barras ?? "—"}</p>
            <p>Precio de venta: ${producto.precio_venta}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-texto">Historial de movimientos</h2>
        <HistorialMovimientos movimientos={movimientosConNombre} />
      </div>
    </div>
  );
}
