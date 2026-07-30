"use client";

import { useSyncExternalStore } from "react";

function suscribirse(notificar: () => void) {
  window.addEventListener("online", notificar);
  window.addEventListener("offline", notificar);
  return () => {
    window.removeEventListener("online", notificar);
    window.removeEventListener("offline", notificar);
  };
}

function leerEstado() {
  return navigator.onLine;
}

function leerEstadoServidor() {
  return true;
}

export function useOnlineStatus() {
  return useSyncExternalStore(suscribirse, leerEstado, leerEstadoServidor);
}
