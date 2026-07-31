"use client";

import { useEffect } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { descargarCatalogo } from "@/lib/sync/catalogo";
import { procesarOutbox } from "@/lib/sync/motor";
import { exponerHerramientasDesarrollo } from "@/lib/sync/debug";

/**
 * Sin interfaz propia. Al montar (una vez por sesión, ya que vive en
 * el layout autenticado) descarga el catálogo y drena lo que haya
 * quedado pendiente de una sesión anterior. Al recuperar conexión,
 * repite ambas cosas.
 *
 * También se suscribe a cambios en productos/categorias/clientes:
 * sin esto, un producto cargado desde Stock no aparecía en el
 * buscador de Ventas hasta recargar la página entera, porque la
 * navegación entre rutas dentro de (app) no vuelve a montar este
 * componente. Debounce corto porque una venta con varios items
 * dispara varios UPDATE seguidos sobre productos (stock_actual).
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

    const supabase = crearClienteNavegador();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let canal: ReturnType<typeof supabase.channel> | undefined;
    let cancelado = false;

    function reDescargarConDebounce() {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => descargarCatalogo().catch(() => {}), 500);
    }

    // El cliente recién creado todavía no cargó la sesión desde las
    // cookies (es async): suscribirse antes de eso deja el socket de
    // Realtime sin autenticar, y la RLS filtra todos los eventos sin
    // avisar (el canal igual queda en estado "SUBSCRIBED").
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelado || !session) return;
      canal = supabase
        .channel("catalogo-local")
        .on("postgres_changes", { event: "*", schema: "public", table: "productos" }, reDescargarConDebounce)
        .on("postgres_changes", { event: "*", schema: "public", table: "categorias" }, reDescargarConDebounce)
        .on("postgres_changes", { event: "*", schema: "public", table: "clientes" }, reDescargarConDebounce)
        .subscribe();
    });

    return () => {
      cancelado = true;
      window.removeEventListener("online", alVolverOnline);
      if (timeoutId) clearTimeout(timeoutId);
      if (canal) supabase.removeChannel(canal);
    };
  }, []);

  return null;
}
