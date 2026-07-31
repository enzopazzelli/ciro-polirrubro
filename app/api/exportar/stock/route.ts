import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { generarExcelStock } from "@/lib/excel/exportarStock";

export async function GET() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  const esAdmin = perfil?.rol === "admin";

  const columnas =
    "nombre, marca, codigo_barras, categoria_id, precio_venta, precio_costo, stock_actual, stock_minimo, activo";

  const [{ data: productos }, { data: categorias }] = await Promise.all([
    esAdmin
      ? supabase.from("productos").select(columnas).order("nombre")
      : supabase.from("productos_lista").select(columnas).order("nombre"),
    supabase.from("categorias").select("id, nombre"),
  ]);

  const nombrePorCategoria = new Map((categorias ?? []).map((c) => [c.id, c.nombre]));

  const buffer = await generarExcelStock(
    (productos ?? []).map((p) => ({
      nombre: p.nombre,
      marca: p.marca,
      codigo_barras: p.codigo_barras,
      categoria: p.categoria_id ? (nombrePorCategoria.get(p.categoria_id) ?? null) : null,
      precio_venta: p.precio_venta,
      precio_costo: p.precio_costo,
      stock_actual: p.stock_actual,
      stock_minimo: p.stock_minimo,
      activo: p.activo,
    }))
  );

  // Cast puntual: TS más nuevo tipa Uint8Array como genérico sobre
  // ArrayBuffer específicamente (no ArrayBufferLike), y exceljs
  // devuelve un buffer tipado más laxo. En runtime siempre es un
  // ArrayBuffer real, nunca un SharedArrayBuffer.
  return new NextResponse(new Blob([buffer as unknown as BlobPart]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="stock-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
