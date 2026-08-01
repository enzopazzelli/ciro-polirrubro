import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioCliente } from "@/components/clientes/FormularioCliente";
import { FormularioPago } from "@/components/clientes/FormularioPago";
import { HistorialCuenta } from "@/components/clientes/HistorialCuenta";
import { IndicadorSaldo } from "@/components/clientes/IndicadorSaldo";
import { BotonActivarCliente } from "@/components/clientes/BotonActivarCliente";
import { BotonEliminarCliente } from "@/components/clientes/BotonEliminarCliente";

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

  // perfil, cliente y movimientos no dependen entre sí (solo del id de ruta
  // y del usuario logueado, que ya tenemos): se piden en paralelo.
  const [{ data: perfil }, { data: cliente }, { data: movimientos }] = await Promise.all([
    supabase.from("perfiles").select("rol, permisos").eq("id", user!.id).single(),
    supabase
      .from("clientes")
      .select("id, nombre, telefono, limite_credito, saldo, direccion, notas, activo")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("movimientos_cuenta")
      .select("id, monto, tipo, creado_en, usuario_id")
      .eq("cliente_id", id)
      .order("creado_en", { ascending: false }),
  ]);
  const esAdmin = perfil!.rol === "admin";
  const puedeEditarLimite = esAdmin || !!perfil!.permisos?.editar_limite_credito;
  const puedeDesactivar = esAdmin || !!perfil!.permisos?.desactivar;

  if (!cliente) {
    notFound();
  }

  const idsUsuarios = [...new Set((movimientos ?? []).map((m) => m.usuario_id).filter((v): v is string => !!v))];
  // perfiles_publico (no perfiles): la RLS de la tabla base solo deja ver el
  // propio perfil o todos si sos admin, y acá hace falta el nombre de
  // cualquiera que haya hecho el movimiento.
  const { data: perfilesUsuarios } =
    idsUsuarios.length > 0
      ? await supabase.from("perfiles_publico").select("id, nombre").in("id", idsUsuarios)
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

        <FormularioCliente cliente={cliente} puedeEditarLimite={puedeEditarLimite} />

        {puedeDesactivar && (
          <div className="flex flex-wrap gap-2">
            <BotonActivarCliente id={cliente.id} activo={cliente.activo} />
            <BotonEliminarCliente id={cliente.id} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-texto">Cuenta corriente</h2>
        <FormularioPago clienteId={cliente.id} />
        <HistorialCuenta movimientos={movimientosConNombre} />
      </div>
    </div>
  );
}
