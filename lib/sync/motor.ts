import { db, type RegistroOutbox } from "@/lib/dexie/db";
import { crearClienteNavegador } from "@/lib/supabase/client";

const ESPERA_BASE_MS = 1000;
const ESPERA_MAXIMA_MS = 30000;

let procesando = false;
let timeoutReintento: ReturnType<typeof setTimeout> | null = null;

function calcularEspera(intentos: number) {
  return Math.min(ESPERA_BASE_MS * 2 ** intentos, ESPERA_MAXIMA_MS);
}

interface ErrorEnvio {
  code?: string;
  message: string;
}

/**
 * Si Postgres/PostgREST respondió con un código de error, la falla es
 * definitiva (el mismo payload va a fallar siempre igual: RLS, check
 * constraint, columna faltante, etc.) y no tiene sentido reintentarla.
 * Si no hay código (fetch rechazado, sin respuesta), es de red: es
 * transitoria y sí vale la pena reintentar.
 */
function esErrorDefinitivo(error: ErrorEnvio): boolean {
  return !!error.code;
}

async function enviarUno(item: RegistroOutbox): Promise<ErrorEnvio | null> {
  // El nombre de tabla solo se conoce en tiempo de ejecución (viene de
  // la outbox), así que este motor genérico no puede tipar el cliente
  // contra una tabla específica. Se pierde el chequeo de tipos acá a
  // propósito, no por descuido.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = crearClienteNavegador() as any;

  try {
    if (item.operacion === "insert") {
      // ignoreDuplicates ⇒ INSERT ... ON CONFLICT (id) DO NOTHING (sección 4.2):
      // un reintento sobre algo que ya se guardó no falla, no-opea.
      const { error } = await supabase
        .from(item.tabla)
        .upsert(item.payload, { onConflict: "id", ignoreDuplicates: true });
      return error ? { code: error.code, message: error.message } : null;
    }

    const { id, ...cambios } = item.payload;
    const { error } = await supabase.from(item.tabla).update(cambios).eq("id", id as string);
    return error ? { code: error.code, message: error.message } : null;
  } catch (e) {
    return { message: e instanceof Error ? e.message : "Error de red" };
  }
}

/**
 * Drena la outbox en orden, una operación a la vez. Se detiene solo
 * si: no queda nada pendiente, el dispositivo está offline, o una
 * operación falló por red (ahí se reprograma con backoff creciente
 * y se corta el resto de esta pasada, para no martillar la red).
 * Las fallas definitivas se apartan y se sigue con la próxima.
 */
export async function procesarOutbox(): Promise<void> {
  if (procesando) return;
  procesando = true;

  if (timeoutReintento) {
    clearTimeout(timeoutReintento);
    timeoutReintento = null;
  }

  try {
    for (;;) {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;

      const item = await db.outbox.where("estado").equals("pendiente").sortBy("creado_en").then((items) => items[0]);
      if (!item || item.id === undefined) return;

      const error = await enviarUno(item);

      if (!error) {
        await db.outbox.delete(item.id);
        continue;
      }

      if (esErrorDefinitivo(error)) {
        await db.outbox.update(item.id, { estado: "fallida", ultimo_error: error.message });
        continue;
      }

      const intentos = item.intentos + 1;
      await db.outbox.update(item.id, { intentos, ultimo_error: error.message });
      const espera = calcularEspera(intentos);
      timeoutReintento = setTimeout(() => {
        procesarOutbox();
      }, espera);
      return;
    }
  } finally {
    procesando = false;
  }
}
