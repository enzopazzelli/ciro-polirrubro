import { redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioImportarStock } from "@/components/stock/FormularioImportarStock";

export default async function PaginaImportarStock() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from("perfiles").select("rol, permisos").eq("id", user!.id).single();
  const esAdmin = perfil!.rol === "admin";
  const puedeGestionarStock = esAdmin || !!perfil!.permisos?.gestionar_stock;

  if (!puedeGestionarStock) {
    redirect("/stock");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-texto">Importar stock desde Excel</h1>
        <Link href="/stock" className="text-sm text-acento underline">
          Volver
        </Link>
      </div>
      <FormularioImportarStock />
    </div>
  );
}
