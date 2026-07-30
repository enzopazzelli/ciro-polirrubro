export type EstadoCuenta = "al_dia" | "debe" | "a_favor";

export function calcularEstadoCuenta(saldo: number): EstadoCuenta {
  if (saldo === 0) return "al_dia";
  if (saldo > 0) return "debe";
  return "a_favor";
}
