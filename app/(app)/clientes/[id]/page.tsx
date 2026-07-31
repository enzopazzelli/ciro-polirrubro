import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioCliente } from "@/components/clientes/FormularioCliente";
import { FormularioPago } from "@/components/clientes/FormularioPago";
import { HistorialCuenta } from "@/components/clientes/HistorialCuenta";
import { IndicadorSaldo } from "@/components/clientes/IndicadorSaldo";

export default async function PaginaFichaCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user!.id).single();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, limite_credito, saldo, direccion, notas")
    .eq("id", id)
    .maybeSingle();

  if (!cliente) {
    notFound();
  }

  const { data: movimientos } = await supabase
    .from("movimientos_cuenta")
    .select("id, monto, tipo, creado_en, usuario_id")
    .eq("cliente_id", id)
    .order("creado_en", { ascending: false });

  const idsUsuarios = [...new Set((movimientos ?? []).map((m) => m.usuario_id).filter((v): v is string => !!v))];
  const { data: perfilesUsuarios } =
    idsUsuarios.length > 0
      ? await supabase.from("perfiles").select("id, nombre").in("id", idsUsuarios)
      : { data: [] as { id: string; nombre: string }[] };

  const nombrePorUsuario = new Map((perfilesUsuarios ?? []).map((p) => [p.id, p.nombre]));

  const movimientosConNombre = (movimientos ?? []).map((m) => ({
    ...m,
    usuario_nombre: m.usuario_id ? (nombrePorUsuario.get(m.usuario_id) ?? null) : null,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-texto">{cliente.nombre}</h1>
          <IndicadorSaldo saldo={cliente.saldo} />
        </div>

        <FormularioCliente cliente={cliente} rol={perfil!.rol} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-texto">Cuenta corriente</h2>
        <FormularioPago clienteId={cliente.id} />
        <HistorialCuenta movimientos={movimientosConNombre} />
      </div>
    </div>
  );
}
