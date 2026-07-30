"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/dexie/db";

export function IndicadorPendientes() {
  const pendientes = useLiveQuery(() => db.outbox.where("estado").equals("pendiente").count(), [], 0);
  const fallidas = useLiveQuery(() => db.outbox.where("estado").equals("fallida").count(), [], 0);

  if (!pendientes && !fallidas) return null;

  return (
    <div className="flex items-center gap-1.5">
      {pendientes > 0 && (
        <span className="flex h-8 items-center rounded-radio-chico bg-acento-suave px-2.5 text-xs font-medium text-acento">
          {pendientes} pendiente{pendientes === 1 ? "" : "s"}
        </span>
      )}
      {fallidas > 0 && (
        <span className="flex h-8 items-center rounded-radio-chico bg-error-suave px-2.5 text-xs font-medium text-error">
          {fallidas} con error
        </span>
      )}
    </div>
  );
}
