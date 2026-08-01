import { iniciales } from "@/lib/texto/iniciales";

const TAMANOS = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
} as const;

const TONOS = {
  // Para usar sobre superficies claras (listas, tarjetas).
  claro: "bg-acento-suave text-acento",
  // Para usar sobre el sidebar oscuro (bordó): circulo claro, texto oscuro.
  "sobre-oscuro": "bg-acento-texto text-acento",
} as const;

export function Avatar({
  nombre,
  tamano = "md",
  tono = "claro",
}: {
  nombre: string;
  tamano?: keyof typeof TAMANOS;
  tono?: keyof typeof TONOS;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${TAMANOS[tamano]} ${TONOS[tono]}`}
    >
      {iniciales(nombre)}
    </div>
  );
}
