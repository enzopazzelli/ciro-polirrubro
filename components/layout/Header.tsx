"use client";

import { useRouter } from "next/navigation";
import { marca } from "@/lib/marca";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { OfflineIndicator } from "@/components/layout/OfflineIndicator";
import { IndicadorPendientes } from "@/components/layout/IndicadorPendientes";
import { ToggleDensidad } from "@/components/layout/ToggleDensidad";
import type { Rol } from "@/types/database";

const ETIQUETA_ROL: Record<Rol, string> = {
  admin: "Dueña",
  operador: "Operadora",
};

export function Header({ nombre, rol }: { nombre: string; rol: Rol }) {
  const router = useRouter();

  async function cerrarSesion() {
    const supabase = crearClienteNavegador();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-borde bg-superficie px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-acento text-xs font-semibold text-acento-texto">
          {marca.iniciales}
        </div>
        <span className="text-sm font-semibold text-texto">{marca.nombre}</span>
      </div>

      <div className="flex items-center gap-3">
        <ToggleDensidad />
        <OfflineIndicator />
        <IndicadorPendientes />
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-texto">{nombre}</p>
          <p className="text-xs text-texto-suave">{ETIQUETA_ROL[rol]}</p>
        </div>
        <button
          onClick={cerrarSesion}
          className="h-11 rounded-radio-chico border border-borde px-3 text-sm text-texto-suave hover:bg-superficie-alt"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
