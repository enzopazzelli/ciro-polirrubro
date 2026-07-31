import ExcelJS from "exceljs";

export interface FilaExportarStock {
  nombre: string;
  marca: string | null;
  codigo_barras: string | null;
  categoria: string | null;
  precio_venta: number;
  precio_costo: number | null;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
}

/**
 * El archivo sirve doble función: exportación de consulta y plantilla
 * para reimportar (ver lib/excel/importarStock.ts). "Stock actual" y
 * "Activo" son informativos — el importador no los lee, porque
 * stock_actual es una caché de solo lectura y desactivar productos
 * por Excel no está contemplado.
 */
export async function generarExcelStock(filas: FilaExportarStock[]): Promise<Uint8Array> {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Stock");

  hoja.columns = [
    { header: "Nombre", key: "nombre", width: 30 },
    { header: "Marca", key: "marca", width: 18 },
    { header: "Código de barras", key: "codigo_barras", width: 18 },
    { header: "Categoría", key: "categoria", width: 18 },
    { header: "Precio de venta", key: "precio_venta", width: 16 },
    { header: "Precio de costo", key: "precio_costo", width: 16 },
    { header: "Stock actual", key: "stock_actual", width: 14 },
    { header: "Stock mínimo", key: "stock_minimo", width: 14 },
    { header: "Cantidad a ingresar", key: "cantidad_a_ingresar", width: 18 },
    { header: "Activo", key: "activo", width: 10 },
  ];
  hoja.getRow(1).font = { bold: true };

  for (const f of filas) {
    hoja.addRow({
      nombre: f.nombre,
      marca: f.marca ?? "",
      codigo_barras: f.codigo_barras ?? "",
      categoria: f.categoria ?? "",
      precio_venta: f.precio_venta,
      precio_costo: f.precio_costo ?? "",
      stock_actual: f.stock_actual,
      stock_minimo: f.stock_minimo,
      cantidad_a_ingresar: "",
      activo: f.activo ? "Sí" : "No",
    });
  }

  const buffer = await libro.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
