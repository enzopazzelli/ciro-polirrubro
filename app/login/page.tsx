import { marca } from "@/lib/marca";
import { FormularioLogin } from "@/components/auth/FormularioLogin";

export default function PaginaLogin() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-acento-suave text-xl font-semibold text-acento">
          {marca.iniciales}
        </div>
        <h1 className="text-lg font-semibold text-texto">{marca.nombre}</h1>
      </div>

      <FormularioLogin />
    </main>
  );
}
