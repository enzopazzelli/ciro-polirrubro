"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Rol } from "@/types/database";

const ITEMS: { href: string; etiqueta: string; soloAdmin?: boolean }[] = [
  { href: "/panel", etiqueta: "Panel" },
  { href: "/ventas", etiqueta: "Ventas" },
  { href: "/stock", etiqueta: "Stock" },
  { href: "/clientes", etiqueta: "Clientes" },
  { href: "/caja", etiqueta: "Caja" },
  { href: "/usuarios", etiqueta: "Usuarios", soloAdmin: true },
];

export function Sidebar({ rol }: { rol: Rol }) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => !item.soloAdmin || rol === "admin");

  return (
    <nav
      aria-label="Navegación principal"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-borde bg-superficie p-2 md:h-screen md:w-48 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-3"
    >
      {items.map((item) => {
        const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex h-11 shrink-0 items-center rounded-radio px-4 text-sm font-medium whitespace-nowrap ${
              activo
                ? "bg-acento-suave text-acento"
                : "text-texto-suave hover:bg-superficie-alt"
            }`}
          >
            {item.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
