import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { generarExcelClientes } from "@/lib/excel/exportarClientes";

export async function GET() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: clientes } = await supabase
    .from("clientes")
    .select("nombre, telefono, direccion, notas, limite_credito, saldo, activo")
    .order("nombre");

  const buffer = await generarExcelClientes(clientes ?? []);

  // Cast puntual: TS más nuevo tipa Uint8Array como genérico sobre
  // ArrayBuffer específicamente (no ArrayBufferLike), y exceljs
  // devuelve un buffer tipado más laxo. En runtime siempre es un
  // ArrayBuffer real, nunca un SharedArrayBuffer.
  return new NextResponse(new Blob([buffer as unknown as BlobPart]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="clientes-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
