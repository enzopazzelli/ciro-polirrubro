"use client";

interface Categoria {
  id: string;
  nombre: string;
}

export function BuscadorProductos({
  texto,
  onTextoChange,
  categoriaId,
  onCategoriaChange,
  categorias,
}: {
  texto: string;
  onTextoChange: (valor: string) => void;
  categoriaId: string | null;
  onCategoriaChange: (valor: string | null) => void;
  categorias: Categoria[];
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        placeholder="Buscar por nombre o escanear un código…"
        value={texto}
        onChange={(e) => onTextoChange(e.target.value)}
        className="h-11 flex-1 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto"
      />
      <select
        value={categoriaId ?? ""}
        onChange={(e) => onCategoriaChange(e.target.value || null)}
        className="h-11 rounded-radio border border-borde bg-superficie px-3 text-sm text-texto sm:w-48"
      >
        <option value="">Todas las categorías</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
