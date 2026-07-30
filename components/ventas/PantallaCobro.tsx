"use client";

import { useMemo, useState } from "react";
import type { ClienteLocal } from "@/lib/dexie/db";
import type { FormaPago, Rol } from "@/types/database";
import { SelectorCliente } from "@/components/ventas/SelectorCliente";
import type { LineaPago } from "@/lib/ventas/confirmarVenta";
import { ETIQUETAS_FORMA_PAGO as ETIQUETAS_FORMA } from "@/lib/ventas/formasDePago";

type LineaEnEdicion = { monto: number; montoRecibido: number | null };
type Pagos = Partial<Record<FormaPago, LineaEnEdicion>>;

export function PantallaCobro({
  total,
  clientes,
  rol,
  onConfirmar,
  onCerrar,
}: {
  total: number;
  clientes: ClienteLocal[];
  rol: Rol;
  onConfirmar: (pagos: LineaPago[], clienteId: string | null) => Promise<void>;
  onCerrar: () => void;
}) {
  const [pagos, setPagos] = useState<Pagos>({});
  const [cliente, setCliente] = useState<ClienteLocal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const montoAsignado = useMemo(
    () => Object.values(pagos).reduce((acc, l) => acc + (l?.monto ?? 0), 0),
    [pagos]
  );
  const restante = total - montoAsignado;

  const lineaCredito = pagos.credito;
  const excedeLimite = !!(
    lineaCredito &&
    cliente &&
    cliente.saldo + lineaCredito.monto > cliente.limite_credito
  );
  const bloqueadoPorLimite = excedeLimite && rol !== "admin";

  const lineaEfectivo = pagos.efectivo;
  const efectivoInsuficiente = !!(
    lineaEfectivo && (lineaEfectivo.montoRecibido ?? 0) < lineaEfectivo.monto
  );
  const vuelto = lineaEfectivo ? (lineaEfectivo.montoRecibido ?? 0) - lineaEfectivo.monto : 0;

  const creditoSinCliente = !!(pagos.credito && !cliente);

  const puedeConfirmar =
    restante === 0 &&
    !enviando &&
    !bloqueadoPorLimite &&
    !efectivoInsuficiente &&
    !creditoSinCliente &&
    montoAsignado > 0;

  function seleccionarForma(forma: FormaPago) {
    if (forma === "credito" && !cliente) return;
    setError(null);
    setPagos((actual) => {
      if (actual[forma]) return actual;
      const otras = Object.values(actual).reduce((acc, l) => acc + (l?.monto ?? 0), 0);
      const monto = Math.max(total - otras, 0);
      return { ...actual, [forma]: { monto, montoRecibido: forma === "efectivo" ? monto : null } };
    });
  }

  function tocarTodo(forma: FormaPago) {
    setPagos((actual) => {
      const otras = Object.entries(actual)
        .filter(([f]) => f !== forma)
        .reduce((acc, [, l]) => acc + (l?.monto ?? 0), 0);
      const monto = Math.max(total - otras, 0);
      return { ...actual, [forma]: { monto, montoRecibido: forma === "efectivo" ? monto : (actual[forma]?.montoRecibido ?? null) } };
    });
  }

  function actualizarMonto(forma: FormaPago, monto: number) {
    setPagos((actual) => ({
      ...actual,
      [forma]: {
        monto,
        montoRecibido: forma === "efectivo" ? monto : (actual[forma]?.montoRecibido ?? null),
      },
    }));
  }

  function actualizarMontoRecibido(monto: number) {
    setPagos((actual) => ({
      ...actual,
      efectivo: { monto: actual.efectivo?.monto ?? 0, montoRecibido: monto },
    }));
  }

  function quitarLinea(forma: FormaPago) {
    setPagos((actual) => {
      const copia = { ...actual };
      delete copia[forma];
      return copia;
    });
  }

  async function confirmar() {
    if (!puedeConfirmar) return;
    setError(null);
    setEnviando(true);

    const lineas: LineaPago[] = (Object.entries(pagos) as [FormaPago, LineaEnEdicion][]).map(
      ([forma_pago, l]) => ({
        forma_pago,
        monto: l.monto,
        monto_recibido: forma_pago === "efectivo" ? l.montoRecibido : null,
      })
    );

    try {
      await onConfirmar(lineas, cliente?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo confirmar la venta");
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-fondo">
      <div className="flex items-center justify-between border-b border-borde px-4 py-3">
        <button onClick={onCerrar} className="h-11 px-2 text-sm text-texto-suave">
          Volver
        </button>
        <h2 className="text-sm font-semibold text-texto">Cobrar</h2>
        <span className="w-14" />
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex flex-col items-center gap-1 rounded-radio bg-superficie-alt p-4">
          <span className="text-xs text-texto-suave">Total</span>
          <span className="font-numeros text-2xl font-semibold text-texto">${total}</span>
          <span className={`font-numeros text-sm ${restante === 0 ? "text-ok" : "text-alerta"}`}>
            Restante: ${restante}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-texto">Cliente (para cuenta corriente)</label>
          <SelectorCliente clientes={clientes} clienteSeleccionado={cliente} onSeleccionar={setCliente} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(ETIQUETAS_FORMA) as FormaPago[]).map((forma) => {
            const deshabilitada = forma === "credito" && !cliente;
            return (
              <button
                key={forma}
                type="button"
                data-testid={`boton-forma-${forma}`}
                disabled={deshabilitada}
                onClick={() => seleccionarForma(forma)}
                className={`flex h-14 flex-col items-center justify-center rounded-radio border text-sm font-medium disabled:opacity-40 ${
                  pagos[forma] ? "border-acento bg-acento-suave text-acento" : "border-borde text-texto"
                }`}
              >
                {ETIQUETAS_FORMA[forma]}
                {deshabilitada && <span className="text-xs font-normal text-texto-suave">Elegí un cliente</span>}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {(Object.entries(pagos) as [FormaPago, LineaEnEdicion][]).map(([forma, linea]) => (
            <div
              key={forma}
              data-testid={`linea-pago-${forma}`}
              className="flex flex-col gap-2 rounded-radio border border-borde bg-superficie p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-texto">{ETIQUETAS_FORMA[forma]}</span>
                <button onClick={() => quitarLinea(forma)} className="text-sm text-texto-suave underline">
                  Quitar
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  data-testid={`monto-${forma}`}
                  value={linea.monto}
                  onChange={(e) => actualizarMonto(forma, Math.max(Math.round(Number(e.target.value)), 0))}
                  className="h-11 flex-1 rounded-radio-chico border border-borde bg-fondo px-3 text-sm text-texto font-numeros"
                />
                <button
                  type="button"
                  data-testid={`todo-${forma}`}
                  onClick={() => tocarTodo(forma)}
                  className="h-11 shrink-0 rounded-radio-chico border border-borde px-4 text-sm font-medium text-texto"
                >
                  Todo
                </button>
              </div>

              {forma === "efectivo" && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-texto-suave">Monto recibido</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    data-testid="monto-recibido-efectivo"
                    value={linea.montoRecibido ?? 0}
                    onChange={(e) => actualizarMontoRecibido(Math.max(Math.round(Number(e.target.value)), 0))}
                    className="h-11 rounded-radio-chico border border-borde bg-fondo px-3 text-sm text-texto font-numeros"
                  />
                  {vuelto > 0 && (
                    <span className="font-numeros text-sm text-ok">Vuelto: ${vuelto}</span>
                  )}
                  {efectivoInsuficiente && (
                    <span className="text-sm text-error">El monto recibido es menor al que cubre esta línea</span>
                  )}
                </div>
              )}

              {forma === "credito" && excedeLimite && (
                <p className="text-sm text-error" role="alert">
                  {rol === "admin"
                    ? "Supera el límite de crédito del cliente. Estás autorizando como dueña."
                    : "Supera el límite de crédito del cliente. Se necesita autorización de la dueña."}
                </p>
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="border-t border-borde p-4">
        <button
          type="button"
          data-testid="confirmar-venta"
          onClick={confirmar}
          disabled={!puedeConfirmar}
          className="h-14 w-full rounded-radio bg-acento text-base font-semibold text-acento-texto disabled:opacity-40"
        >
          {enviando ? "Confirmando…" : "Confirmar"}
        </button>
      </div>
    </div>
  );
}
