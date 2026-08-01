import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SincronizadorFondo } from "@/components/layout/SincronizadorFondo";

export default async function LayoutApp({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, rol")
    .eq("id", user.id)
    .single();

  if (!perfil) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <SincronizadorFondo />
      <Sidebar rol={perfil.rol} nombre={perfil.nombre} />
      <div className="flex flex-1 flex-col">
        <Header nombre={perfil.nombre} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
