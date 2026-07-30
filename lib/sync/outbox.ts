import { db } from "@/lib/dexie/db";
import { procesarOutbox } from "@/lib/sync/motor";

/**
 * Encola una operación para subir a Supabase cuando haya conexión.
 *
 * Para 'insert'/'update', el payload siempre incluye `id` (generado
 * en el dispositivo, sección 4.2). Para 'rpc', `tabla` es el nombre
 * de la función (ej. "confirmar_venta") y el payload son sus
 * argumentos.
 *
 * Esto solo encola. Escribir el resultado optimista en la tabla
 * espejo de Dexie correspondiente es responsabilidad de quien llama
 * (la forma de esa escritura depende de cada entidad).
 *
 * Dispara procesarOutbox() al terminar, sin esperarlo: si ya hay
 * conexión, no tiene sentido esperar al próximo evento 'online' para
 * empezar a drenar.
 */
export async function agregarAOutbox(
  operacion: "insert" | "update" | "rpc",
  tabla: string,
  payload: Record<string, unknown>
) {
  await db.outbox.add({
    operacion,
    tabla,
    payload,
    intentos: 0,
    estado: "pendiente",
    creado_en: Date.now(),
  });

  procesarOutbox();
}
