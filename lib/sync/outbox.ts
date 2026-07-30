import { db } from "@/lib/dexie/db";

/**
 * Encola una operación para subir a Supabase cuando haya conexión.
 * El payload siempre tiene que incluir `id` (generado en el
 * dispositivo, sección 4.2): en un insert es la fila completa; en un
 * update, `id` más las columnas que cambiaron.
 *
 * Esto solo encola. Escribir el resultado optimista en la tabla
 * espejo de Dexie correspondiente es responsabilidad de quien llama
 * (la forma de esa escritura depende de cada entidad).
 */
export async function agregarAOutbox(
  operacion: "insert" | "update",
  tabla: string,
  payload: Record<string, unknown> & { id: string }
) {
  await db.outbox.add({
    operacion,
    tabla,
    payload,
    intentos: 0,
    estado: "pendiente",
    creado_en: Date.now(),
  });
}
