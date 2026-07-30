"use client";

interface Props {
  nombre: string;
  cantidad: number;
  subtotal: number;
  flash: boolean;
  onIncrementar: () => void;
  onDecrementar: () => void;
  onQuitar: () => void;
}

export function LineaCarrito({ nombre, cantidad, subtotal, flash, onIncrementar, onDecrementar, onQuitar }: Props) {
  return (
    <div
      className={`flex items-center gap-2 rounded-radio border border-borde p-2 transition-colors duration-300 ${
        flash ? "bg-ok-suave" : "bg-superficie"
      }`}
    >
      <span className="flex-1 truncate text-sm font-medium text-texto">{nombre}</span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDecrementar}
          aria-label="Restar"
          className="flex h-11 w-11 items-center justify-center rounded-radio-chico border border-borde text-lg text-texto-suave"
        >
          −
        </button>
        <span className="w-8 text-center font-numeros text-sm text-texto">{cantidad}</span>
        <button
          type="button"
          onClick={onIncrementar}
          aria-label="Sumar"
          className="flex h-11 w-11 items-center justify-center rounded-radio-chico border border-borde text-lg text-texto-suave"
        >
          +
        </button>
      </div>

      <span className="w-20 text-right font-numeros text-sm text-texto">${subtotal}</span>

      <button
        type="button"
        onClick={onQuitar}
        aria-label="Eliminar"
        className="flex h-11 w-11 items-center justify-center rounded-radio-chico text-error"
      >
        ✕
      </button>
    </div>
  );
}
