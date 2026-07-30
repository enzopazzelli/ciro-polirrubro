import { redirect } from "next/navigation";
import { verificarAdmin } from "@/lib/auth/verificarAdmin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioIngreso } from "@/components/stock/FormularioIngreso";

export default async function PaginaIngreso() {
  const auth = await verificarAdmin();
  if (!auth.ok) {
    redirect("/stock");
  }

  const supabase = await crearClienteServidor();
  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, codigo_barras")
    .eq("activo", true)
    .order("nombre");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-texto">Ingreso de mercadería</h1>
      <FormularioIngreso productos={productos ?? []} />
    </div>
  );
}
