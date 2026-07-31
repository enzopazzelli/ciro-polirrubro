import { crearClienteServidor } from "@/lib/supabase/server";
import { ListaProductos } from "@/components/stock/ListaProductos";

export default async function PaginaStock() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, permisos")
    .eq("id", user!.id)
    .single();
  const puedeGestionarStock = perfil!.rol === "admin" || !!perfil!.permisos?.gestionar_stock;

  const [{ data: productos }, { data: categorias }] = await Promise.all([
    supabase
      .from("productos_lista")
      .select("id, nombre, marca, codigo_barras, categoria_id, precio_venta, stock_actual, stock_minimo, activo")
      .order("nombre"),
    supabase.from("categorias").select("id, nombre").order("orden"),
  ]);

  return (
    <ListaProductos
      productos={productos ?? []}
      categorias={categorias ?? []}
      rol={perfil!.rol}
      puedeGestionarStock={puedeGestionarStock}
    />
  );
}
