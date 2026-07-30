import type { FormaPago } from "@/types/database";

export const ETIQUETAS_FORMA_PAGO: Record<FormaPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  credito: "Cuenta corriente",
};
