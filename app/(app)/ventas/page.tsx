import { crearClienteServidor } from "@/lib/supabase/server";
import { PantallaVentas } from "@/components/ventas/PantallaVentas";

export default async function PaginaVentas() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase.from("perfiles").select("rol, permisos").eq("id", user!.id).single();
  const puedeExcederLimite = perfil!.rol === "admin" || !!perfil!.permisos?.exceder_limite_credito;

  // Etapa 7 todavía no existe: no hay pantalla para abrir/cerrar caja.
  // Si hay una abierta (creada a mano o en una etapa futura), la
  // venta la usa; si no, se vende igual y el efectivo no entra a
  // ningún arqueo (así lo describe la sección de la Etapa 5).
  const { data: cajas } = await supabase
    .from("cajas")
    .select("id")
    .eq("estado", "abierta")
    .order("abierta_en", { ascending: false })
    .limit(1);

  return (
    <PantallaVentas
      puedeExcederLimite={puedeExcederLimite}
      usuarioId={user!.id}
      cajaId={cajas?.[0]?.id ?? null}
    />
  );
}
