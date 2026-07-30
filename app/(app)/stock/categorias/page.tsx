import { redirect } from "next/navigation";
import { verificarAdmin } from "@/lib/auth/verificarAdmin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { ListaCategorias } from "@/components/stock/categorias/ListaCategorias";

export default async function PaginaCategorias() {
  const auth = await verificarAdmin();
  if (!auth.ok) {
    redirect("/stock");
  }

  const supabase = await crearClienteServidor();
  const { data: categorias } = await supabase.from("categorias").select("id, nombre, orden").order("orden");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-texto">Categorías</h1>
      <ListaCategorias categoriasIniciales={categorias ?? []} />
    </div>
  );
}
