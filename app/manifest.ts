import type { MetadataRoute } from "next";
import { marca } from "@/lib/marca";

// background_color/theme_color no pueden venir de los tokens de
// app/globals.css: el manifest se serializa a JSON estático antes de
// que exista cualquier CSS del navegador. Son los mismos valores que
// --color-fondo y --color-acento hoy; si se cambia la palema en
// globals.css, actualizar acá también.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: marca.nombre,
    short_name: marca.nombre,
    description: `Sistema de gestión de ${marca.nombre}`,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#18181B",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
