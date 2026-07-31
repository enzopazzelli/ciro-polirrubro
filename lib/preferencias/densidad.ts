"use client";

import { useSyncExternalStore } from "react";

export type Densidad = "comoda" | "compacta";

const CLAVE = "ciro_densidad";
const oyentes = new Set<() => void>();

let valorActual: Densidad =
  typeof window !== "undefined" && localStorage.getItem(CLAVE) === "compacta"
    ? "compacta"
    : "comoda";

if (typeof document !== "undefined") {
  document.documentElement.dataset.densidad = valorActual;
}

function suscribirse(notificar: () => void) {
  oyentes.add(notificar);
  return () => oyentes.delete(notificar);
}

function leerEstado(): Densidad {
  return valorActual;
}

function leerEstadoServidor(): Densidad {
  return "comoda";
}

export function setDensidad(d: Densidad) {
  valorActual = d;
  document.documentElement.dataset.densidad = d;
  localStorage.setItem(CLAVE, d);
  oyentes.forEach((notificar) => notificar());
}

export function useDensidad() {
  return useSyncExternalStore(suscribirse, leerEstado, leerEstadoServidor);
}
