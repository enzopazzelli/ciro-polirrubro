import { crearClienteServidor } from "@/lib/supabase/server";
import { obtenerDatosPanel } from "@/lib/panel/datos";
import { PanelAdmin } from "@/components/panel/PanelAdmin";
import { PanelOperador } from "@/components/panel/PanelOperador";

export default async function PaginaPanel() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user!.id).single();
  const esAdmin = perfil!.rol === "admin";

  const datos = await obtenerDatosPanel(supabase, esAdmin);

  return esAdmin ? <PanelAdmin datos={datos} /> : <PanelOperador datos={datos} />;
}
