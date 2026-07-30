import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next.js 16 renombró middleware.ts a proxy.ts (la función pasó de
// llamarse `middleware` a `proxy`). El runtime es Node.js siempre,
// no hay edge acá.

const RUTAS_PUBLICAS = ["/login"];
const RUTAS_ADMIN = ["/usuarios"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() revalida el JWT contra el servidor de Auth. getSession()
  // solo lee la cookie sin verificar, no sirve para decidir acceso.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const esRutaPublica = RUTAS_PUBLICAS.some((r) => pathname.startsWith(r));

  const irA = (destino: string) => {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    return NextResponse.redirect(url);
  };

  if (!user) {
    return esRutaPublica ? response : irA("/login");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, activo")
    .eq("id", user.id)
    .single();

  // Un usuario desactivado pierde acceso de inmediato, aunque su JWT
  // siga vigente: se lo desloguea acá mismo.
  if (!perfil?.activo) {
    await supabase.auth.signOut();
    return irA("/login");
  }

  if (esRutaPublica) {
    return irA("/panel");
  }

  if (RUTAS_ADMIN.some((r) => pathname.startsWith(r)) && perfil.rol !== "admin") {
    return irA("/panel");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
