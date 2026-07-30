import { Tarjeta } from "@/components/panel/Tarjeta";
import { IndicadorStock } from "@/components/stock/IndicadorStock";
import type { DatosPanel } from "@/lib/panel/datos";

export function PanelOperador({ datos }: { datos: DatosPanel }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Tarjeta titulo="Ventas de hoy">
        <p className="font-numeros text-3xl font-semibold text-texto">${datos.ventasDelDia.total}</p>
        <p className="text-sm text-texto-suave">{datos.ventasDelDia.cantidad} operaciones</p>
      </Tarjeta>

      <Tarjeta titulo="Caja">
        {datos.caja ? (
          <>
            <p className="text-sm text-ok">Abierta</p>
            <p className="text-sm text-texto-suave">
              Desde las {new Date(datos.caja.abierta_en).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </>
        ) : (
          <p className="text-sm text-texto-suave">No hay una caja abierta</p>
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
    </div>
  );
}
