import "server-only";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import type { Rol } from "@/types/database";

export interface UsuarioListado {
  id: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  creado_en: string;
  email: string | null;
}

/**
 * Lista perfiles + su email (que vive en auth.users, no en perfiles).
 * Requiere la service_role key, así que solo se llama después de
 * verificarAdmin().
 */
export async function listarUsuarios(): Promise<UsuarioListado[]> {
  const admin = crearClienteAdmin();

  const { data: perfiles, error } = await admin
    .from("perfiles")
    .select("id, nombre, rol, activo, creado_en")
    .order("creado_en", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const { data: listaAuth, error: errorAuth } = await admin.auth.admin.listUsers();
  if (errorAuth) {
    throw new Error(errorAuth.message);
  }

  const emailPorId = new Map(listaAuth.users.map((u) => [u.id, u.email ?? null]));

  return perfiles.map((p) => ({ ...p, email: emailPorId.get(p.id) ?? null }));
}
