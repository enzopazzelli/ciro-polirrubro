const CARACTERES_FORMULA = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Antepone una comilla a un texto que empiece con un caracter que Excel/
 * Sheets podría interpretar como el inicio de una fórmula (ej. un nombre
 * o nota cargado como "=HYPERLINK(...)"), para que la celda se lea
 * siempre como texto plano. Ver OWASP "CSV/Excel Injection" — sin esto,
 * abrir un archivo exportado con un dato así cargado (por error o a
 * propósito) puede ejecutar una fórmula en vez de mostrar el texto.
 */
export function celdaSegura(valor: string): string {
  if (valor.length > 0 && CARACTERES_FORMULA.includes(valor[0])) {
    return `'${valor}`;
  }
  return valor;
}
