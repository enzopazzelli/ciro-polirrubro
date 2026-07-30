import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioProducto } from "@/components/stock/FormularioProducto";

export default async function PaginaNuevoProducto({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user!.id).single();
  const { data: categorias } = await supabase.from("categorias").select("id, nombre").order("orden");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-texto">Nuevo producto</h1>
      <FormularioProducto categorias={categorias ?? []} rol={perfil!.rol} codigoInicial={codigo} />
    </div>
  );
}
