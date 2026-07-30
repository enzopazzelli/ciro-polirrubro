import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioCliente } from "@/components/clientes/FormularioCliente";

export default async function PaginaNuevoCliente() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user!.id).single();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-texto">Nuevo cliente</h1>
      <FormularioCliente rol={perfil!.rol} />
    </div>
  );
}
