"use client";

import { useRouter } from "next/navigation";
import { marca } from "@/lib/marca";
import { fuenteMarca } from "@/lib/fuentes";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { OfflineIndicator } from "@/components/layout/OfflineIndicator";
import { IndicadorPendientes } from "@/components/layout/IndicadorPendientes";
import { ToggleDensidad } from "@/components/layout/ToggleDensidad";

export function Header({ nombre }: { nombre: string }) {
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
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-acento text-sm text-acento-texto shadow-[inset_0_-2px_3px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] ${fuenteMarca.className}`}
        >
          {marca.iniciales}
        </div>
        <span className="text-sm font-semibold text-texto">{marca.nombre}</span>
      </div>

      <div className="flex items-center gap-3">
        <ToggleDensidad />
        <OfflineIndicator />
        <IndicadorPendientes />
        <p className="text-sm font-medium text-texto">{nombre}</p>
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
