import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioProducto } from "@/components/stock/FormularioProducto";
import { BotonActivarProducto } from "@/components/stock/BotonActivarProducto";
import { BotonEliminarProducto } from "@/components/stock/BotonEliminarProducto";
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

  const { data: perfil } = await supabase.from("perfiles").select("rol, permisos").eq("id", user!.id).single();
  const esAdmin = perfil!.rol === "admin";
  const puedeEditar = esAdmin || !!perfil!.permisos?.editar_precio_venta;
  const puedeVerCosto = esAdmin || !!perfil!.permisos?.ver_precio_costo;
  const puedeDesactivar = esAdmin || !!perfil!.permisos?.desactivar;

  const columnas =
    "id, nombre, marca, codigo_barras, categoria_id, precio_venta, precio_costo, stock_actual, stock_minimo, activo";

  const { data: producto } = esAdmin
    ? await supabase.from("productos").select(columnas).eq("id", id).maybeSingle()
    : await supabase.from("productos_lista").select(columnas).eq("id", id).maybeSingle();

  if (!producto) {
    notFound();
  }

  // categorias y movimientos no dependen entre sí ni de producto: se piden
  // en paralelo para no encadenar viajes de ida y vuelta a la base.
  const [{ data: categorias }, { data: movimientos }] = await Promise.all([
    supabase.from("categorias").select("id, nombre").order("orden"),
    supabase
      .from("movimientos_stock")
      .select("id, cantidad, tipo, motivo, creado_en, usuario_id")
      .eq("producto_id", id)
      .order("creado_en", { ascending: false }),
  ]);

  const idsUsuarios = [...new Set((movimientos ?? []).map((m) => m.usuario_id).filter((v): v is string => !!v))];
  // perfiles_publico (no perfiles): la RLS de la tabla base solo deja ver el
  // propio perfil o todos si sos admin, y acá hace falta el nombre de
  // cualquiera que haya hecho el movimiento.
  const { data: perfilesUsuarios } =
    idsUsuarios.length > 0
      ? await supabase.from("perfiles_publico").select("id, nombre").in("id", idsUsuarios)
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

        {puedeEditar ? (
          <FormularioProducto
            producto={producto}
            categorias={categorias ?? []}
            rol={perfil!.rol}
            puedeVerCosto={puedeVerCosto}
          />
        ) : (
          <div className="flex flex-col gap-1 text-sm text-texto">
            <p>Marca: {producto.marca ?? "—"}</p>
            <p>Código de barras: {producto.codigo_barras ?? "—"}</p>
            <p>Precio de venta: ${producto.precio_venta}</p>
            {puedeVerCosto && producto.precio_costo != null && (
              <p>
                Precio de costo: ${producto.precio_costo}{" "}
                {producto.precio_venta > 0 && (
                  <span className="text-texto-suave">
                    (margen: {Math.round(((producto.precio_venta - producto.precio_costo) / producto.precio_venta) * 100)}%)
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {puedeDesactivar && (
          <div className="flex flex-wrap gap-2">
            <BotonActivarProducto id={producto.id} activo={producto.activo} />
            <BotonEliminarProducto id={producto.id} />
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
