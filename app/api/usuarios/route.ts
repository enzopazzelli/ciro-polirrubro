import { NextResponse } from "next/server";
import { verificarAdmin } from "@/lib/auth/verificarAdmin";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { listarUsuarios } from "@/lib/usuarios/listar";
import type { PermisosOperador, Rol } from "@/types/database";

// Route Handler del lado servidor: acá y solo acá se usa la
// service_role key (sección 6). Todo pedido primero pasa por
// verificarAdmin(), que valida el JWT de quien llama y su rol en
// perfiles antes de tocar nada.

export async function GET() {
  const auth = await verificarAdmin();
  if (!auth.ok) return auth.response;

  try {
    const usuarios = await listarUsuarios();
    return NextResponse.json({ usuarios });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verificarAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const rol: Rol = body.rol === "admin" ? "admin" : "operador";

  if (!nombre || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Nombre, email y una contraseña de al menos 6 caracteres son obligatorios" },
      { status: 400 }
    );
  }

  const admin = crearClienteAdmin();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? "No se pudo crear el usuario" }, { status: 400 });
  }

  const { error: errorPerfil } = await admin.from("perfiles").insert({
    id: data.user.id,
    nombre,
    rol,
  });

  if (errorPerfil) {
    // No dejamos un usuario de Auth huérfano sin perfil.
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: errorPerfil.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.user.id }, { status: 201 });
}

async function quedariaSinAdminActivo(
  admin: ReturnType<typeof crearClienteAdmin>,
  idExcluido: string
) {
  const { count } = await admin
    .from("perfiles")
    .select("id", { count: "exact", head: true })
    .eq("rol", "admin")
    .eq("activo", true)
    .neq("id", idExcluido);

  return (count ?? 0) === 0;
}

export async function PATCH(request: Request) {
  const auth = await verificarAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : null;

  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : undefined;
  const rol: Rol | undefined = body.rol === "admin" || body.rol === "operador" ? body.rol : undefined;
  const activo = typeof body.activo === "boolean" ? body.activo : undefined;
  const password = typeof body.password === "string" ? body.password : undefined;
  const permisosCambios: PermisosOperador | undefined =
    body.permisos && typeof body.permisos === "object" ? body.permisos : undefined;

  if (id === auth.userId) {
    if (rol === "operador") {
      return NextResponse.json(
        { error: "No podés quitarte el rol de admin a vos misma/o" },
        { status: 400 }
      );
    }
    if (activo === false) {
      return NextResponse.json(
        { error: "No podés desactivarte a vos misma/o" },
        { status: 400 }
      );
    }
  }

  const admin = crearClienteAdmin();

  const { data: actual } = await admin.from("perfiles").select("rol").eq("id", id).single();

  if (actual?.rol === "admin") {
    const bajaDeAdmin = rol === "operador";
    const desactivacion = activo === false;
    if ((bajaDeAdmin || desactivacion) && (await quedariaSinAdminActivo(admin, id))) {
      return NextResponse.json(
        { error: "Debe quedar al menos un admin activo" },
        { status: 400 }
      );
    }
  }

  if (password && password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  const cambiosPerfil: { nombre?: string; rol?: Rol; activo?: boolean } = {};
  if (nombre !== undefined) cambiosPerfil.nombre = nombre;
  if (rol !== undefined) cambiosPerfil.rol = rol;
  if (activo !== undefined) cambiosPerfil.activo = activo;

  if (Object.keys(cambiosPerfil).length > 0) {
    const { error } = await admin.from("perfiles").update(cambiosPerfil).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (password) {
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (permisosCambios) {
    // Merge, no reemplazo: cada checkbox de la UI manda solo la
    // clave que cambió, no el objeto completo.
    const { data: perfilActual } = await admin.from("perfiles").select("permisos").eq("id", id).single();
    const permisosMergeados = { ...(perfilActual?.permisos ?? {}), ...permisosCambios };
    const { error } = await admin.from("perfiles").update({ permisos: permisosMergeados }).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Además de activo=false en perfiles (que ya bloquea el acceso vía
  // RLS/proxy), baneamos al usuario en Auth para que no pueda ni
  // iniciar sesión de nuevo.
  if (activo === false) {
    await admin.auth.admin.updateUserById(id, { ban_duration: "876000h" });
  } else if (activo === true) {
    await admin.auth.admin.updateUserById(id, { ban_duration: "none" });
  }

  return NextResponse.json({ ok: true });
}
