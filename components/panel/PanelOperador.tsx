import { Tarjeta } from "@/components/panel/Tarjeta";
import { TarjetaEstadistica } from "@/components/panel/TarjetaEstadistica";
import { IndicadorStock } from "@/components/stock/IndicadorStock";
import type { DatosPanel } from "@/lib/panel/datos";

export function PanelOperador({ datos }: { datos: DatosPanel }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <TarjetaEstadistica
          titulo="Ventas de hoy"
          valor={`$${datos.ventasDelDia.total}`}
          sub={`${datos.ventasDelDia.cantidad} operaciones`}
          color="acento"
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
    </div>
  );
}
