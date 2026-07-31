import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioAjuste } from "@/components/stock/FormularioAjuste";

export default async function PaginaAjuste() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from("perfiles").select("rol, permisos").eq("id", user!.id).single();
  const esAdmin = perfil!.rol === "admin";
  const puedeGestionarStock = esAdmin || !!perfil!.permisos?.gestionar_stock;

  if (!puedeGestionarStock) {
    redirect("/stock");
  }

  const { data: productos } = await (esAdmin
    ? supabase.from("productos").select("id, nombre, codigo_barras, stock_actual").eq("activo", true).order("nombre")
    : supabase
        .from("productos_lista")
        .select("id, nombre, codigo_barras, stock_actual")
        .eq("activo", true)
        .order("nombre"));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-texto">Ajustar stock</h1>
      <FormularioAjuste productos={productos ?? []} />
    </div>
  );
}
