import { db } from "@/lib/dexie/db";
import { agregarAOutbox } from "@/lib/sync/outbox";
import { procesarOutbox } from "@/lib/sync/motor";
import { descargarCatalogo } from "@/lib/sync/catalogo";

declare global {
  interface Window {
    __ciroSync?: {
      db: typeof db;
      agregarAOutbox: typeof agregarAOutbox;
      procesarOutbox: typeof procesarOutbox;
      descargarCatalogo: typeof descargarCatalogo;
    };
  }
}

/**
 * Expone el motor de sincronización en window, solo para poder
 * ejercitarlo desde pruebas de navegador. process.env.NODE_ENV es
 * estático en build time, así que esto se elimina por completo del
 * bundle de producción (dead-code elimination), no del código en sí.
 */
export function exponerHerramientasDesarrollo() {
  if (process.env.NODE_ENV !== "development") return;
  window.__ciroSync = { db, agregarAOutbox, procesarOutbox, descargarCatalogo };
}
