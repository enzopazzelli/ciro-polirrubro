import { crearClienteServidor } from "@/lib/supabase/server";
import { ListaProductos } from "@/components/stock/ListaProductos";

export default async function PaginaStock() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user!.id)
    .single();

  const [{ data: productos }, { data: categorias }] = await Promise.all([
    supabase
      .from("productos_lista")
      .select("id, nombre, codigo_barras, categoria_id, precio_venta, stock_actual, stock_minimo, activo")
      .order("nombre"),
    supabase.from("categorias").select("id, nombre").order("orden"),
  ]);

  return (
    <ListaProductos
      productos={productos ?? []}
      categorias={categorias ?? []}
      rol={perfil!.rol}
    />
  );
}
