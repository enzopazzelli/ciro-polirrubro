"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Rol } from "@/types/database";
import { FormularioUsuario } from "@/components/usuarios/FormularioUsuario";
import { ModalCambiarPassword } from "@/components/usuarios/ModalCambiarPassword";

interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  creado_en: string;
  email: string | null;
}

export function ListaUsuarios({
  usuariosIniciales,
  idPropio,
}: {
  usuariosIniciales: Usuario[];
  idPropio: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [usuarioParaPassword, setUsuarioParaPassword] = useState<Usuario | null>(null);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);

  async function actualizar(id: string, cambios: Record<string, unknown>) {
    setGuardandoId(id);
    setError(null);
    const res = await fetch("/api/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...cambios }),
    });
    const body = await res.json();
    setGuardandoId(null);

    if (!res.ok) {
      setError(body.error ?? "No se pudo guardar el cambio");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <FormularioUsuario onCreado={() => router.refresh()} />

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {usuariosIniciales.map((u) => (
          <div
            key={u.id}
            className="flex flex-col gap-3 rounded-radio border border-borde bg-superficie p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  defaultValue={u.nombre}
                  onBlur={(e) => {
                    const valor = e.target.value.trim();
                    if (valor && valor !== u.nombre) {
                      actualizar(u.id, { nombre: valor });
                    }
                  }}
                  className="h-11 rounded-radio-chico border border-borde bg-fondo px-3 text-sm text-texto"
                />
                {!u.activo && (
                  <span className="rounded-radio-chico bg-error-suave px-2 py-1 text-xs font-medium text-error">
                    Desactivado
                  </span>
                )}
                {u.id === idPropio && (
                  <span className="rounded-radio-chico bg-acento-suave px-2 py-1 text-xs font-medium text-acento">
                    Vos
                  </span>
                )}
              </div>
              <p className="text-xs text-texto-suave">{u.email}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={u.rol}
                disabled={u.id === idPropio || guardandoId === u.id}
                onChange={(e) => actualizar(u.id, { rol: e.target.value })}
                className="h-11 rounded-radio-chico border border-borde bg-fondo px-3 text-sm text-texto disabled:opacity-50"
              >
                <option value="admin">Admin</option>
                <option value="operador">Operador</option>
              </select>

              <button
                onClick={() => setUsuarioParaPassword(u)}
                disabled={guardandoId === u.id}
                className="h-11 rounded-radio-chico border border-borde px-3 text-sm text-texto-suave hover:bg-superficie-alt disabled:opacity-50"
              >
                Cambiar contraseña
              </button>

              <button
                onClick={() => actualizar(u.id, { activo: !u.activo })}
                disabled={u.id === idPropio || guardandoId === u.id}
                className="h-11 rounded-radio-chico border border-borde px-3 text-sm text-texto-suave hover:bg-superficie-alt disabled:opacity-50"
              >
                {u.activo ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {usuarioParaPassword && (
        <ModalCambiarPassword
          usuario={usuarioParaPassword}
          onCerrar={() => setUsuarioParaPassword(null)}
          onGuardar={async (password) => {
            await actualizar(usuarioParaPassword.id, { password });
            setUsuarioParaPassword(null);
          }}
        />
      )}
    </div>
  );
}
