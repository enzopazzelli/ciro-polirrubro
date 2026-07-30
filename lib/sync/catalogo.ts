import { db } from "@/lib/dexie/db";
import { crearClienteNavegador } from "@/lib/supabase/client";

/**
 * Descarga categorías, productos y clientes a Dexie. Se llama al
 * iniciar sesión y de nuevo cada vez que el dispositivo recupera
 * conexión, para acotar la ventana en la que el mostrador podría
 * quedar desactualizado (sección 4.4: la dueña puede ingresar
 * mercadería mientras el mostrador está offline). Clientes se suma
 * en la Etapa 5: una venta a crédito offline necesita poder leer
 * saldo y límite de crédito sin red.
 */
export async function descargarCatalogo(): Promise<void> {
  const supabase = crearClienteNavegador();

  const [{ data: categorias }, { data: productos }, { data: clientes }] = await Promise.all([
    supabase.from("categorias").select("id, nombre, orden"),
    supabase
      .from("productos_lista")
      .select(
        "id, nombre, codigo_barras, categoria_id, precio_venta, precio_costo, stock_actual, stock_minimo, activo"
      ),
    supabase.from("clientes").select("id, nombre, telefono, limite_credito, saldo, activo"),
  ]);

  await db.transaction("rw", db.categorias, db.productos, db.clientes, async () => {
    await db.categorias.clear();
    if (categorias && categorias.length > 0) {
      await db.categorias.bulkAdd(categorias);
    }

    await db.productos.clear();
    if (productos && productos.length > 0) {
      await db.productos.bulkAdd(productos);
    }

    await db.clientes.clear();
    if (clientes && clientes.length > 0) {
      await db.clientes.bulkAdd(clientes);
    }
  });
}
