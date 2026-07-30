// Crea los dos usuarios iniciales (dueña admin + operadora) directo
// en Supabase Auth con la service_role key, y su fila espejo en
// perfiles. No es parte de las migraciones SQL porque auth.users
// lo administra Supabase Auth, no un INSERT plano.
//
// Uso: node --env-file=.env.local scripts/seed-usuarios.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const usuarios = [
  {
    nombre: "Ciro (dueña)",
    email: "duena@ciropolirrubro.com.ar",
    password: "CONTRASENA_ROTADA",
    rol: "admin",
  },
  {
    nombre: "Operadora mostrador",
    email: "operadora@ciropolirrubro.com.ar",
    password: "CONTRASENA_ROTADA",
    rol: "operador",
  },
];

for (const u of usuarios) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  });

  if (error) {
    console.error(`Error creando ${u.email}:`, error.message);
    continue;
  }

  const { error: errorPerfil } = await admin.from("perfiles").insert({
    id: data.user.id,
    nombre: u.nombre,
    rol: u.rol,
  });

  if (errorPerfil) {
    console.error(`Error creando perfil de ${u.email}:`, errorPerfil.message);
    continue;
  }

  console.log(`OK: ${u.rol} creado — ${u.email} / ${u.password}`);
}
