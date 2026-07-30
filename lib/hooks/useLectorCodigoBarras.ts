"use client";

import { useEffect, useRef } from "react";

// La pistola escribe como un teclado, muy rápido, y termina con Enter.
// Menos de 50ms entre caracteres es una pistola; un humano no escribe
// así (sección "Lectura de código de barras" de la Etapa 5, pero el
// buscador y el alta de producto de la Etapa 2 ya lo necesitan).
const INTERVALO_ESCANER_MS = 50;
const TIMEOUT_FINALIZAR_MS = 100;
const LARGO_MINIMO = 3;

function hayCampoDeTextoEnfocado() {
  const activo = document.activeElement;
  if (!activo) return false;
  const tag = activo.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (activo as HTMLElement).isContentEditable;
}

/**
 * Escucha el teclado a nivel de ventana y avisa cuando detecta un
 * escaneo (no un tipeo humano). Se desactiva solo mientras haya un
 * campo de texto enfocado; para modales, pasar `activo=false`.
 */
export function useLectorCodigoBarras(onEscaneo: (codigo: string) => void, activo: boolean = true) {
  const bufferRef = useRef("");
  const ultimaTeclaRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(onEscaneo);

  useEffect(() => {
    callbackRef.current = onEscaneo;
  });

  useEffect(() => {
    if (!activo) return;

    function limpiarTimeout() {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function finalizar() {
      const codigo = bufferRef.current;
      bufferRef.current = "";
      if (codigo.length >= LARGO_MINIMO) {
        callbackRef.current(codigo);
      }
    }

    function alTeclear(e: KeyboardEvent) {
      if (hayCampoDeTextoEnfocado()) return;

      const ahora = performance.now();
      const intervalo = ahora - ultimaTeclaRef.current;
      ultimaTeclaRef.current = ahora;

      if (e.key === "Enter") {
        limpiarTimeout();
        if (bufferRef.current.length > 0) {
          e.preventDefault();
          finalizar();
        }
        return;
      }

      if (e.key.length !== 1) return; // ignora Shift, Control, flechas, etc.

      // Tecla aislada, muy separada de la anterior: es tipeo humano, no un escaneo.
      if (bufferRef.current.length > 0 && intervalo > INTERVALO_ESCANER_MS) {
        bufferRef.current = "";
      }

      bufferRef.current += e.key;

      limpiarTimeout();
      timeoutRef.current = setTimeout(finalizar, TIMEOUT_FINALIZAR_MS);
    }

    window.addEventListener("keydown", alTeclear);
    return () => {
      window.removeEventListener("keydown", alTeclear);
      limpiarTimeout();
    };
  }, [activo]);
}
