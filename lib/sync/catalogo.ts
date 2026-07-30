import { db } from "@/lib/dexie/db";
import { crearClienteNavegador } from "@/lib/supabase/client";

/**
 * Descarga categorías y productos a Dexie. Se llama al iniciar
 * sesión y de nuevo cada vez que el dispositivo recupera conexión,
 * para acotar la ventana en la que el mostrador podría quedar
 * desactualizado (sección 4.4: la dueña puede ingresar mercadería
 * mientras el mostrador está offline).
 */
export async function descargarCatalogo(): Promise<void> {
  const supabase = crearClienteNavegador();

  const [{ data: categorias }, { data: productos }] = await Promise.all([
    supabase.from("categorias").select("id, nombre, orden"),
    supabase
      .from("productos_lista")
      .select(
        "id, nombre, codigo_barras, categoria_id, precio_venta, precio_costo, stock_actual, stock_minimo, activo"
      ),
  ]);

  await db.transaction("rw", db.categorias, db.productos, async () => {
    await db.categorias.clear();
    if (categorias && categorias.length > 0) {
      await db.categorias.bulkAdd(categorias);
    }

    await db.productos.clear();
    if (productos && productos.length > 0) {
      await db.productos.bulkAdd(productos);
    }
  });
}
