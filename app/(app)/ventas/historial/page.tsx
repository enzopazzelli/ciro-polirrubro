import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { ListaHistorialVentas } from "@/components/ventas/ListaHistorialVentas";

export default async function PaginaHistorialVentas() {
  const supabase = await crearClienteServidor();

  const { data: ventas } = await supabase
    .from("ventas")
    .select("id, numero, total, creado_en, anulada, cliente_id, usuario_id")
    .order("creado_en", { ascending: false })
    .limit(200);

  const idsClientes = [...new Set((ventas ?? []).map((v) => v.cliente_id).filter((v): v is string => !!v))];
  const idsUsuarios = [...new Set((ventas ?? []).map((v) => v.usuario_id).filter((v): v is string => !!v))];

  const [{ data: clientes }, { data: usuarios }] = await Promise.all([
    idsClientes.length > 0
      ? supabase.from("clientes").select("id, nombre").in("id", idsClientes)
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    idsUsuarios.length > 0
      ? supabase.from("perfiles").select("id, nombre").in("id", idsUsuarios)
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
  ]);

  const nombreCliente = new Map((clientes ?? []).map((c) => [c.id, c.nombre]));
  const nombreUsuario = new Map((usuarios ?? []).map((u) => [u.id, u.nombre]));

  const ventasConNombres = (ventas ?? []).map((v) => ({
    id: v.id,
    numero: v.numero,
    total: v.total,
    creado_en: v.creado_en,
    anulada: v.anulada,
    cliente_nombre: v.cliente_id ? (nombreCliente.get(v.cliente_id) ?? null) : null,
    usuario_nombre: v.usuario_id ? (nombreUsuario.get(v.usuario_id) ?? null) : null,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-texto">Historial de ventas</h1>
        <div className="flex items-center gap-3">
          <a href="/api/exportar/ventas" className="text-sm text-acento underline">
            Exportar Excel
          </a>
          <Link href="/ventas" className="text-sm text-acento underline">
            Volver a vender
          </Link>
        </div>
      </div>
      <ListaHistorialVentas ventas={ventasConNombres} />
    </div>
  );
}
