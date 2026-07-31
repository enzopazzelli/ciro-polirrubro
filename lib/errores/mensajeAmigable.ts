interface ErrorSupabase {
  code?: string;
  message: string;
}

const MENSAJES_POR_CODIGO: Record<string, string> = {
  "23505": "Ese valor ya está en uso por otro registro.",
  "23502": "Falta completar un campo obligatorio.",
  "23503": "No se puede completar: hay otro registro que depende de este.",
  "22P02": "Uno de los valores ingresados no tiene el formato esperado.",
  "42501": "No tenés permiso para hacer esto.",
};

/**
 * Traduce un error de Supabase/Postgres a un mensaje que se le pueda
 * mostrar a quien está usando la app.
 *
 * Los RAISE EXCEPTION que escribimos a mano en triggers y funciones
 * (código P0001, el que usa Postgres por defecto) ya vienen en
 * español y explican el caso puntual — se muestran tal cual. Solo
 * se traducen los errores genéricos que Postgres devuelve solo.
 */
export function mensajeAmigable(error: ErrorSupabase | null | undefined): string {
  if (!error) return "Ocurrió un error inesperado.";

  if (error.code === "P0001") return error.message;

  if (error.code && MENSAJES_POR_CODIGO[error.code]) {
    return MENSAJES_POR_CODIGO[error.code];
  }

  if (!error.code) {
    return "No se pudo conectar. Revisá tu conexión e intentá de nuevo.";
  }

  return "Ocurrió un error. Si vuelve a pasar, avisá.";
}
