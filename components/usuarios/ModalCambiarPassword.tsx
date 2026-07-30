"use client";

import { useState } from "react";

export function ModalCambiarPassword({
  usuario,
  onCerrar,
  onGuardar,
}: {
  usuario: { id: string; nombre: string };
  onCerrar: () => void;
  onGuardar: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setGuardando(true);
    setError(null);
    await onGuardar(password);
    setGuardando(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCerrar}
    >
      <form
        onSubmit={confirmar}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-3 rounded-radio bg-superficie p-5"
      >
        <h2 className="text-sm font-semibold text-texto">
          Cambiar contraseña de {usuario.nombre}
        </h2>

        <input
          type="password"
          autoFocus
          placeholder="Nueva contraseña"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 rounded-radio-chico border border-borde bg-fondo px-3 text-sm text-texto"
        />

        {error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCerrar}
            className="h-11 flex-1 rounded-radio border border-borde text-sm text-texto-suave"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="h-11 flex-1 rounded-radio bg-acento text-sm font-medium text-acento-texto disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
