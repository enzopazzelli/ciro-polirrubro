// Crea la cuenta admin inicial directo en Supabase Auth con la
// service_role key, y su fila espejo en perfiles. No es parte de las
// migraciones SQL porque auth.users lo administra Supabase Auth, no
// un INSERT plano.
//
// Solo crea la cuenta admin a propósito: cualquier otra cuenta
// (operadoras, etc.) se crea después desde /usuarios, ya logueado
// como admin — no hace falta este script para eso.
//
// La contraseña NUNCA se hardcodea acá: se genera al azar (o se
// puede pasar por variable de entorno) y se imprime una sola vez al
// final. Guardala en un gestor de contraseñas; no queda en ningún
// archivo del repo.
//
// Uso:
//   node --env-file=.env.local scripts/seed-usuarios.mjs
//
// Para fijar el email/nombre/contraseña en vez de los valores por defecto:
//   SEED_ADMIN_EMAIL=... SEED_ADMIN_NOMBRE=... SEED_ADMIN_PASSWORD=... node --env-file=.env.local scripts/seed-usuarios.mjs

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}

function generarPassword() {
  return randomBytes(12).toString("base64url");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const cuentaAdmin = {
  nombre: process.env.SEED_ADMIN_NOMBRE || "Administrador/a",
  email: process.env.SEED_ADMIN_EMAIL || "admin@ejemplo.com.ar",
  password: process.env.SEED_ADMIN_PASSWORD || generarPassword(),
};

const { data, error } = await admin.auth.admin.createUser({
  email: cuentaAdmin.email,
  password: cuentaAdmin.password,
  email_confirm: true,
});

if (error) {
  console.error(`Error creando ${cuentaAdmin.email}:`, error.message);
  process.exit(1);
}

const { error: errorPerfil } = await admin.from("perfiles").insert({
  id: data.user.id,
  nombre: cuentaAdmin.nombre,
  rol: "admin",
});

if (errorPerfil) {
  console.error(`Error creando perfil de ${cuentaAdmin.email}:`, errorPerfil.message);
  process.exit(1);
}

console.log(`OK: admin creado — ${cuentaAdmin.email} / ${cuentaAdmin.password}`);
console.log("Para crear operadoras u otras cuentas, entrá con esta y hacelo desde /usuarios.");
