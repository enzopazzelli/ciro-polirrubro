import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente con service_role key: bypassea RLS por completo.
 * Solo se usa en Route Handlers, después de verificar el JWT y el rol admin.
 * El import "server-only" hace fallar el build si esto se importa desde
 * un Client Component.
 */
export function crearClienteAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
