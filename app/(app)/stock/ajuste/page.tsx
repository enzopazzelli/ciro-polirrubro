import { redirect } from "next/navigation";
import { verificarAdmin } from "@/lib/auth/verificarAdmin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioAjuste } from "@/components/stock/FormularioAjuste";

export default async function PaginaAjuste() {
  const auth = await verificarAdmin();
  if (!auth.ok) {
    redirect("/stock");
  }

  const supabase = await crearClienteServidor();
  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, codigo_barras, stock_actual")
    .eq("activo", true)
    .order("nombre");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-texto">Ajustar stock</h1>
      <FormularioAjuste productos={productos ?? []} />
    </div>
  );
}
