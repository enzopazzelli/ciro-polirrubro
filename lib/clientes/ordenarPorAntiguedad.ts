interface ClienteConSaldo {
  id: string;
  saldo: number;
}

/**
 * Clientes con deuda (saldo > 0), ordenados por antigüedad: el que
 * hace más tiempo que no tiene actividad (ni compra ni paga) va
 * primero. Se usa tanto en el listado de clientes (Etapa 3) como en
 * el panel (Etapa 6).
 */
export function ordenarClientesConDeudaPorAntiguedad<T extends ClienteConSaldo>(
  clientes: T[],
  ultimaActividadPorCliente: Record<string, string>
): T[] {
  return clientes
    .filter((c) => c.saldo > 0)
    .sort((a, b) => {
      const fa = ultimaActividadPorCliente[a.id] ?? "";
      const fb = ultimaActividadPorCliente[b.id] ?? "";
      return fa.localeCompare(fb);
    });
}
