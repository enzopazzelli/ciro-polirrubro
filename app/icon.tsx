import { ImageResponse } from "next/og";
import { marca } from "@/lib/marca";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Excepción intencional a "sin colores escritos a mano" (sección 7):
// Satori (lo que renderiza este ImageResponse) no tiene acceso al CSS
// del navegador ni a las custom properties de globals.css, así que no
// hay forma de leer los tokens acá. Son los mismos valores que
// --color-acento / --color-acento-texto hoy.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#6E1B22",
          color: "#FAD6D1",
          fontSize: 220,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {marca.iniciales}
      </div>
    ),
    { ...size }
  );
}
