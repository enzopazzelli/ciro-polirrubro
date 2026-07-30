"use client";

import { useEffect } from "react";
import { descargarCatalogo } from "@/lib/sync/catalogo";
import { procesarOutbox } from "@/lib/sync/motor";
import { exponerHerramientasDesarrollo } from "@/lib/sync/debug";

/**
 * Sin interfaz propia. Al montar (una vez por sesión, ya que vive en
 * el layout autenticado) descarga el catálogo y drena lo que haya
 * quedado pendiente de una sesión anterior. Al recuperar conexión,
 * repite ambas cosas.
 */
export function SincronizadorFondo() {
  useEffect(() => {
    exponerHerramientasDesarrollo();
    descargarCatalogo().catch(() => {});
    procesarOutbox();

    function alVolverOnline() {
      descargarCatalogo().catch(() => {});
      procesarOutbox();
    }

    window.addEventListener("online", alVolverOnline);
    return () => window.removeEventListener("online", alVolverOnline);
  }, []);

  return null;
}
