import { redirect } from "next/navigation";
import { verificarAdmin } from "@/lib/auth/verificarAdmin";
import { listarUsuarios } from "@/lib/usuarios/listar";
import { ListaUsuarios } from "@/components/usuarios/ListaUsuarios";

export default async function PaginaUsuarios() {
  const auth = await verificarAdmin();
  if (!auth.ok) {
    redirect("/panel");
  }

  const usuarios = await listarUsuarios();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-texto">Usuarios</h1>
      <ListaUsuarios usuariosIniciales={usuarios} idPropio={auth.userId} />
    </div>
  );
}
