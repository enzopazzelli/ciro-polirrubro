import { Baloo_2 } from "next/font/google";

// Tipografía redondeada y de trazo grueso, en la misma familia visual
// que el logo real de la clienta (letras gruesas y curvas). Se usa
// solo en la insignia de marca (Header, login) — el resto de la app
// sigue con --fuente (system-ui) para no complicar la lectura de
// tablas y formularios.
export const fuenteMarca = Baloo_2({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});
