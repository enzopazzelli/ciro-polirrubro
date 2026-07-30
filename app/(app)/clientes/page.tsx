import { crearClienteServidor } from "@/lib/supabase/server";
import { ListaClientes } from "@/components/clientes/ListaClientes";

export default async function PaginaClientes() {
  const supabase = await crearClienteServidor();

  const [{ data: clientes }, { data: movimientos }] = await Promise.all([
    supabase.from("clientes").select("id, nombre, telefono, saldo").eq("activo", true).order("nombre"),
    supabase
      .from("movimientos_cuenta")
      .select("cliente_id, creado_en")
      .order("creado_en", { ascending: false }),
  ]);

  const ultimaActividadPorCliente: Record<string, string> = {};
  for (const m of movimientos ?? []) {
    if (!(m.cliente_id in ultimaActividadPorCliente)) {
      ultimaActividadPorCliente[m.cliente_id] = m.creado_en;
    }
  }

  return <ListaClientes clientes={clientes ?? []} ultimaActividadPorCliente={ultimaActividadPorCliente} />;
}
