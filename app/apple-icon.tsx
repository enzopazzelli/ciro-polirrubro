import { ImageResponse } from "next/og";
import { marca } from "@/lib/marca";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Misma excepción que app/icon.tsx: Satori no puede leer los tokens
// de globals.css.
export default function AppleIcon() {
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
          fontSize: 76,
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
