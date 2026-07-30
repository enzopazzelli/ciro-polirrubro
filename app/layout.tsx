import type { Metadata } from "next";
import { marca } from "@/lib/marca";
import "./globals.css";

export const metadata: Metadata = {
  title: marca.nombre,
  description: `Sistema de gestión de ${marca.nombre}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-fondo text-texto">
        {children}
      </body>
    </html>
  );
}
