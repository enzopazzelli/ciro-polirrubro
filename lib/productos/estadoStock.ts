export type EstadoStock = "normal" | "bajo" | "agotado";

export function calcularEstadoStock(stockActual: number, stockMinimo: number): EstadoStock {
  if (stockActual <= 0) return "agotado";
  if (stockActual <= stockMinimo) return "bajo";
  return "normal";
}
