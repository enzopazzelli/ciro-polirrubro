"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { Tarjeta } from "@/components/panel/Tarjeta";
import { TarjetaEstadistica } from "@/components/panel/TarjetaEstadistica";
import { IndicadorStock } from "@/components/stock/IndicadorStock";
import { IndicadorSaldo } from "@/components/clientes/IndicadorSaldo";
import { Avatar } from "@/components/ui/Avatar";
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

  const deudaTotal = datos.clientesConDeuda.reduce((acc, c) => acc + c.saldo, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TarjetaEstadistica
          titulo="Ventas de hoy"
          valor={`$${datos.ventasDelDia.total}`}
          sub={`${datos.ventasDelDia.cantidad} operaciones`}
          color="acento"
        />
        <TarjetaEstadistica
          titulo="Productos con poco stock"
          valor={String(datos.stockCritico.length)}
          sub="Requieren reposición"
          color={datos.stockCritico.length > 0 ? "error" : "ok"}
        />
        <TarjetaEstadistica
          titulo="Deudas pendientes"
          valor={`$${deudaTotal}`}
          sub={`${datos.clientesConDeuda.length} clientes con saldo`}
          color={deudaTotal > 0 ? "error" : "ok"}
        />
        <TarjetaEstadistica
          titulo="Caja"
          valor={datos.caja ? `$${datos.caja.monto_apertura}` : "—"}
          sub={
            datos.caja
              ? `Abierta desde las ${new Date(datos.caja.abierta_en).toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "No hay una caja abierta"
          }
          color={datos.caja ? "ok" : "neutro"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Stock crítico" badge={`${datos.stockCritico.length} productos`}>
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

        <Tarjeta titulo="Clientes con deuda" badge={`${datos.clientesConDeuda.length} clientes`}>
          {datos.clientesConDeuda.length === 0 ? (
            <p className="text-sm text-texto-suave">Nadie debe en este momento.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {datos.clientesConDeuda.slice(0, 8).map((c) => (
                <Link
                  key={c.id}
                  href={`/clientes/${c.id}`}
                  className="-mx-1 flex items-center gap-2.5 rounded-radio-chico px-1 py-1.5 hover:bg-superficie-alt"
                >
                  <Avatar nombre={c.nombre} tamano="sm" />
                  <span className="flex-1 truncate text-sm text-texto">{c.nombre}</span>
                  <IndicadorSaldo saldo={c.saldo} />
                </Link>
              ))}
            </div>
          )}
        </Tarjeta>
      </div>

      <Tarjeta titulo="Desglose por forma de pago">
        {datos.desglosePorFormaPago.length === 0 ? (
          <p className="text-sm text-texto-suave">Todavía no hay ventas hoy.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {datos.desglosePorFormaPago.map((d) => (
              <div key={d.forma_pago} className="flex flex-col gap-0.5 rounded-radio-chico bg-superficie-alt px-3 py-2">
                <span className="text-xs text-texto-suave">{ETIQUETAS_FORMA_PAGO[d.forma_pago]}</span>
                <span className="font-numeros text-sm font-semibold text-texto">${d.monto}</span>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Últimas ventas">
        {datos.ultimasVentas.length === 0 ? (
          <p className="text-sm text-texto-suave">Todavía no hay ventas registradas.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {datos.ultimasVentas.map((v) => (
              <Link
                key={v.id}
                href={`/ventas/historial/${v.id}`}
                className="-mx-1 flex items-center gap-2.5 rounded-radio-chico px-1 py-1.5 text-sm hover:bg-superficie-alt"
              >
                <Avatar nombre={v.cliente_nombre ?? "Consumidor Final"} tamano="sm" />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="truncate text-texto">
                    #{v.numero} · {v.cliente_nombre ?? "Consumidor final"}
                  </span>
                  <span className="text-xs text-texto-suave" suppressHydrationWarning>
                    {new Date(v.creado_en).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    {v.usuario_nombre ? ` · ${v.usuario_nombre}` : ""}
                  </span>
                </div>
                <span className="font-numeros font-medium text-texto">${v.total}</span>
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
