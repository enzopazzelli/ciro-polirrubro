"use client";

import { useState } from "react";
import type { Rol } from "@/types/database";

export function FormularioUsuario({ onCreado }: { onCreado: () => void }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("operador");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password, rol }),
    });
    const body = await res.json();
    setEnviando(false);

    if (!res.ok) {
      setError(body.error ?? "No se pudo crear el usuario");
      return;
    }

    setNombre("");
    setEmail("");
    setPassword("");
    setRol("operador");
    onCreado();
  }

  return (
    <form
      onSubmit={enviar}
      className="flex flex-col gap-3 rounded-radio border border-borde bg-superficie p-4"
    >
      <h2 className="text-sm font-semibold text-texto">Nuevo usuario</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          placeholder="Nombre"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="h-11 rounded-radio-chico border border-borde bg-fondo px-3 text-sm text-texto"
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 rounded-radio-chico border border-borde bg-fondo px-3 text-sm text-texto"
        />
        <input
          type="password"
          placeholder="Contraseña (mín. 6 caracteres)"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 rounded-radio-chico border border-borde bg-fondo px-3 text-sm text-texto"
        />
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value as Rol)}
          className="h-11 rounded-radio-chico border border-borde bg-fondo px-3 text-sm text-texto"
        >
          <option value="operador">Operador</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="h-11 self-start rounded-radio bg-acento px-5 text-sm font-medium text-acento-texto disabled:opacity-60"
      >
        {enviando ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}
