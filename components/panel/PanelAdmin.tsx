"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { Tarjeta } from "@/components/panel/Tarjeta";
import { IndicadorStock } from "@/components/stock/IndicadorStock";
import { IndicadorSaldo } from "@/components/clientes/IndicadorSaldo";
import { ETIQUETAS_FORMA_PAGO } from "@/lib/ventas/formasDePago";
import type { DatosPanel } from "@/lib/panel/datos";

export function PanelAdmin({ datos }: { datos: DatosPanel }) {
  const router = useRouter();

  // Sección 4.5: la dueña se suscribe a estas tres tablas para ver la
  // actividad del mostrador sin recargar. Ante cualquier cambio, se
  // vuelve a pedir todo al servidor en vez de mezclar a mano en el
  // cliente: es más simple y ya es el patrón que usa el resto de la app.
  useEffect(() => {
    const supabase = crearClienteNavegador();
    const canal = supabase
      .channel("panel-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "ventas" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "movimientos_stock" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "movimientos_cuenta" }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [router]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Tarjeta titulo="Ventas de hoy">
        <p className="font-numeros text-3xl font-semibold text-texto">${datos.ventasDelDia.total}</p>
        <p className="text-sm text-texto-suave">{datos.ventasDelDia.cantidad} operaciones</p>
      </Tarjeta>

      <Tarjeta titulo="Caja">
        {datos.caja ? (
          <>
            <p className="text-sm text-ok">Abierta</p>
            <p className="text-sm text-texto-suave" suppressHydrationWarning>
              Desde las{" "}
              {new Date(datos.caja.abierta_en).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </>
        ) : (
          <p className="text-sm text-texto-suave">No hay una caja abierta</p>
        )}
      </Tarjeta>

      <Tarjeta titulo="Desglose por forma de pago">
        {datos.desglosePorFormaPago.length === 0 ? (
          <p className="text-sm text-texto-suave">Todavía no hay ventas hoy.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {datos.desglosePorFormaPago.map((d) => (
              <div key={d.forma_pago} className="flex items-center justify-between text-sm">
                <span className="text-texto-suave">{ETIQUETAS_FORMA_PAGO[d.forma_pago]}</span>
                <span className="font-numeros text-texto">${d.monto}</span>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Stock crítico">
        {datos.stockCritico.length === 0 ? (
          <p className="text-sm text-texto-suave">Todo el stock está en orden.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {datos.stockCritico.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <span className="text-sm text-texto">{p.nombre}</span>
                <IndicadorStock stockActual={p.stock_actual} stockMinimo={p.stock_minimo} />
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Clientes con deuda">
        {datos.clientesConDeuda.length === 0 ? (
          <p className="text-sm text-texto-suave">Nadie debe en este momento.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {datos.clientesConDeuda.slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <span className="text-sm text-texto">{c.nombre}</span>
                <IndicadorSaldo saldo={c.saldo} />
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Últimas ventas">
        {datos.ultimasVentas.length === 0 ? (
          <p className="text-sm text-texto-suave">Todavía no hay ventas registradas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {datos.ultimasVentas.map((v) => (
              <Link
                key={v.id}
                href={`/ventas/historial/${v.id}`}
                className="flex items-center justify-between gap-2 rounded-radio-chico text-sm hover:bg-superficie-alt"
              >
                <div className="flex flex-col">
                  <span className="text-texto">#{v.numero} · {v.cliente_nombre ?? "Consumidor final"}</span>
                  <span className="text-xs text-texto-suave" suppressHydrationWarning>
                    {new Date(v.creado_en).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    {v.usuario_nombre ? ` · ${v.usuario_nombre}` : ""}
                  </span>
                </div>
                <span className="font-numeros text-texto">${v.total}</span>
              </Link>
            ))}
          </div>
        )}
        <Link href="/ventas/historial" className="text-sm text-acento underline">
          Ver historial completo
        </Link>
      </Tarjeta>
    </div>
  );
}
