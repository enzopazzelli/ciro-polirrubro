"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { marca } from "@/lib/marca";
import { fuenteMarca } from "@/lib/fuentes";
import { Avatar } from "@/components/ui/Avatar";
import type { Rol } from "@/types/database";

const ITEMS: { href: string; etiqueta: string; icono: string; soloAdmin?: boolean }[] = [
  { href: "/panel", etiqueta: "Panel", icono: "◼" },
  { href: "/ventas", etiqueta: "Ventas", icono: "🛒" },
  { href: "/stock", etiqueta: "Stock", icono: "📦" },
  { href: "/clientes", etiqueta: "Clientes", icono: "👥" },
  { href: "/caja", etiqueta: "Caja", icono: "🏦" },
  { href: "/usuarios", etiqueta: "Usuarios", icono: "👤", soloAdmin: true },
];

const ETIQUETAS_ROL: Record<Rol, string> = {
  admin: "Administradora",
  operador: "Operador/a",
};

export function Sidebar({ rol, nombre }: { rol: Rol; nombre: string }) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => !item.soloAdmin || rol === "admin");

  return (
    <nav
      aria-label="Navegación principal"
      className="flex shrink-0 flex-col overflow-x-auto border-b border-borde bg-superficie md:h-screen md:w-56 md:overflow-visible md:border-b-0 md:border-r-0 md:bg-acento"
    >
      {/* Marca — solo en el sidebar de escritorio; en mobile ya la muestra el Header. */}
      <div className="hidden border-b border-acento-texto/10 px-5 py-5 md:block">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-acento-texto text-sm text-acento shadow-[inset_0_-2px_3px_rgba(0,0,0,0.15)] ${fuenteMarca.className}`}
          >
            {marca.iniciales}
          </div>
          <span className="text-[15px] font-semibold text-acento-texto">{marca.nombre}</span>
        </div>
        <p className="mt-1 text-xs text-acento-texto/50">Sistema de gestión</p>
      </div>

      <div className="flex gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col md:gap-0.5 md:overflow-visible md:p-3">
        {items.map((item) => {
          const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 shrink-0 items-center gap-3 rounded-radio px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activo
                  ? "bg-acento-suave text-acento md:bg-black/15 md:text-acento-texto"
                  : "text-texto-suave hover:bg-superficie-alt md:text-acento-texto/55 md:hover:bg-black/10 md:hover:text-acento-texto/90"
              }`}
            >
              <span className="text-base leading-none">{item.icono}</span>
              {item.etiqueta}
            </Link>
          );
        })}
      </div>

      {/* Chip de usuario — solo visible en escritorio; el nombre y el
          botón de salir ya están en el Header para todos los tamaños. */}
      <div className="hidden border-t border-acento-texto/10 p-3 md:block">
        <div className="flex items-center gap-2.5 rounded-radio px-2 py-2">
          <Avatar nombre={nombre} tono="sobre-oscuro" tamano="sm" />
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-acento-texto">{nombre}</span>
            <span className="text-xs text-acento-texto/50">{ETIQUETAS_ROL[rol]}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
