import "server-only";
import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

type ResultadoVerificacion =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Verifica que quien llama a un Route Handler tiene una sesión
 * válida y es admin activo. Es el candado que exige la sección 6
 * antes de tocar cualquier cosa con la service_role key.
 */
export async function verificarAdmin(): Promise<ResultadoVerificacion> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, activo")
    .eq("id", user.id)
    .single();

  if (!perfil?.activo || perfil.rol !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id };
}
