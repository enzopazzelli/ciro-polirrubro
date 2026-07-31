import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { parsearExcelStock } from "@/lib/excel/importarStock";

export async function POST(request: Request) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: perfil } = await supabase.from("perfiles").select("rol, permisos").eq("id", user.id).single();
  const esAdmin = perfil?.rol === "admin";
  const puedeGestionarStock = esAdmin || !!perfil?.permisos?.gestionar_stock;

  if (!puedeGestionarStock) {
    return NextResponse.json({ error: "No tenés permiso para importar stock" }, { status: 403 });
  }

  const formData = await request.formData();
  const archivo = formData.get("archivo");

  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());
  const { filas, errores } = await parsearExcelStock(buffer);

  if (filas.length === 0) {
    return NextResponse.json({
      creados: 0,
      actualizados: 0,
      conIngreso: 0,
      errores: errores.length > 0 ? errores : [{ fila: 0, mensaje: "No se encontraron filas con datos" }],
    });
  }

  const [{ data: productosExistentes }, { data: categoriasExistentes }] = await Promise.all([
    supabase.from("productos_lista").select("id, codigo_barras"),
    supabase.from("categorias").select("id, nombre"),
  ]);

  const idPorCodigoBarras = new Map(
    (productosExistentes ?? []).filter((p) => p.codigo_barras).map((p) => [p.codigo_barras, p.id])
  );
  const idPorNombreCategoria = new Map(
    (categoriasExistentes ?? []).map((c) => [c.nombre.trim().toLowerCase(), c.id])
  );

  let creados = 0;
  let actualizados = 0;
  let conIngreso = 0;

  for (const fila of filas) {
    const categoriaId = fila.categoria ? (idPorNombreCategoria.get(fila.categoria.toLowerCase()) ?? null) : null;
    const idExistente = fila.codigoBarras ? idPorCodigoBarras.get(fila.codigoBarras) : undefined;

    let idProducto: string | undefined;

    if (idExistente) {
      const { error } = await supabase.rpc("actualizar_producto", {
        p_id: idExistente,
        p_nombre: fila.nombre,
        p_marca: fila.marca,
        p_codigo_barras: fila.codigoBarras,
        p_categoria_id: categoriaId,
        p_precio_venta: fila.precioVenta,
        p_precio_costo: fila.precioCosto,
        p_stock_minimo: fila.stockMinimo,
      });
      if (error) {
        errores.push({ fila: fila.fila, mensaje: `"${fila.nombre}": ${error.message}` });
        continue;
      }
      idProducto = idExistente;
      actualizados++;
    } else {
      const { data, error } = await supabase
        .from("productos")
        .insert({
          nombre: fila.nombre,
          marca: fila.marca,
          codigo_barras: fila.codigoBarras,
          categoria_id: categoriaId,
          precio_venta: fila.precioVenta,
          precio_costo: esAdmin ? fila.precioCosto : null,
          stock_minimo: fila.stockMinimo,
        })
        .select("id")
        .single();
      if (error || !data) {
        errores.push({ fila: fila.fila, mensaje: `"${fila.nombre}": ${error?.message ?? "no se pudo crear"}` });
        continue;
      }
      idProducto = data.id;
      creados++;
    }

    if (idProducto && fila.cantidadAIngresar > 0) {
      const { error: errorIngreso } = await supabase.from("movimientos_stock").insert({
        producto_id: idProducto,
        cantidad: fila.cantidadAIngresar,
        tipo: "ingreso",
        motivo: "Importación desde Excel",
        usuario_id: user.id,
      });
      if (errorIngreso) {
        errores.push({
          fila: fila.fila,
          mensaje: `"${fila.nombre}": se guardó el producto pero no se pudo cargar el ingreso de stock (${errorIngreso.message})`,
        });
      } else {
        conIngreso++;
      }
    }
  }

  return NextResponse.json({ creados, actualizados, conIngreso, errores });
}
