"use client";

import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

export function OfflineIndicator() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <span className="flex h-8 items-center gap-1.5 rounded-radio-chico bg-alerta-suave px-2.5 text-xs font-medium text-alerta">
      <span className="h-1.5 w-1.5 rounded-full bg-alerta" />
      Sin conexión
    </span>
  );
}
