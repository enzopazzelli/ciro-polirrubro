"use client";

import { useDensidad, setDensidad } from "@/lib/preferencias/densidad";

export function ToggleDensidad() {
  const densidad = useDensidad();

  return (
    <div className="flex items-center rounded-radio-chico border border-borde p-0.5 text-xs" role="group" aria-label="Densidad de las listas">
      <button
        type="button"
        onClick={() => setDensidad("comoda")}
        aria-pressed={densidad === "comoda"}
        title="Filas más grandes"
        className={`rounded-radio-chico px-2 py-1.5 font-medium ${
          densidad === "comoda" ? "bg-acento-suave text-acento" : "text-texto-suave hover:bg-superficie-alt"
        }`}
      >
        Cómoda
      </button>
      <button
        type="button"
        onClick={() => setDensidad("compacta")}
        aria-pressed={densidad === "compacta"}
        title="Filas más chicas"
        className={`rounded-radio-chico px-2 py-1.5 font-medium ${
          densidad === "compacta" ? "bg-acento-suave text-acento" : "text-texto-suave hover:bg-superficie-alt"
        }`}
      >
        Compacta
      </button>
    </div>
  );
}
