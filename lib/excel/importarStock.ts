import ExcelJS from "exceljs";

export interface FilaImportarStock {
  fila: number;
  nombre: string;
  marca: string | null;
  codigoBarras: string | null;
  categoria: string | null;
  precioVenta: number;
  precioCosto: number | null;
  stockMinimo: number;
  cantidadAIngresar: number;
}

export interface ResultadoParseoStock {
  filas: FilaImportarStock[];
  errores: { fila: number; mensaje: string }[];
}

function celda(fila: ExcelJS.Row, encabezados: Map<string, number>, ...nombres: string[]): unknown {
  for (const nombre of nombres) {
    const col = encabezados.get(nombre);
    if (col) return fila.getCell(col).value;
  }
  return undefined;
}

function textoDeCelda(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "object" && "text" in (valor as { text?: string })) {
    return String((valor as { text?: string }).text ?? "").trim();
  }
  return String(valor).trim();
}

export async function parsearExcelStock(buffer: Uint8Array): Promise<ResultadoParseoStock> {
  const libro = new ExcelJS.Workbook();
  // exceljs declara su propio tipo Buffer resuelto contra una copia
  // anidada de @types/node (vía @fast-csv, dependencia transitiva de
  // exceljs) que no coincide estructuralmente con el Buffer del
  // proyecto. En runtime es el mismo Buffer de Node siempre;
  // "as unknown as Buffer" no alcanza porque el chequeo vuelve a
  // correr contra el tipo del parámetro declarado en exceljs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await libro.xlsx.load(buffer as any);
  const hoja = libro.worksheets[0];

  if (!hoja) {
    return { filas: [], errores: [{ fila: 0, mensaje: "El archivo no tiene ninguna hoja" }] };
  }

  const encabezados = new Map<string, number>();
  hoja.getRow(1).eachCell((c, col) => {
    encabezados.set(textoDeCelda(c.value).toLowerCase(), col);
  });

  const filas: FilaImportarStock[] = [];
  const errores: { fila: number; mensaje: string }[] = [];

  hoja.eachRow((fila, numeroFila) => {
    if (numeroFila === 1) return;

    const nombre = textoDeCelda(celda(fila, encabezados, "nombre"));
    if (!nombre) return;

    const precioVentaRaw = celda(fila, encabezados, "precio de venta");
    const precioVenta = Math.round(Number(precioVentaRaw));
    if (precioVentaRaw === undefined || precioVentaRaw === null || Number.isNaN(precioVenta) || precioVenta < 0) {
      errores.push({ fila: numeroFila, mensaje: `"${nombre}": falta o es inválido el precio de venta` });
      return;
    }

    const precioCostoRaw = celda(fila, encabezados, "precio de costo");
    const precioCostoTexto = textoDeCelda(precioCostoRaw);
    const precioCosto = precioCostoTexto !== "" ? Math.round(Number(precioCostoRaw)) : null;

    const stockMinimoRaw = celda(fila, encabezados, "stock mínimo", "stock minimo");
    const stockMinimoTexto = textoDeCelda(stockMinimoRaw);
    const stockMinimo = stockMinimoTexto !== "" ? Math.round(Number(stockMinimoRaw)) : 5;

    const cantidadRaw = celda(fila, encabezados, "cantidad a ingresar");
    const cantidadTexto = textoDeCelda(cantidadRaw);
    const cantidadAIngresar = cantidadTexto !== "" ? Math.round(Number(cantidadRaw)) : 0;

    filas.push({
      fila: numeroFila,
      nombre,
      marca: textoDeCelda(celda(fila, encabezados, "marca")) || null,
      codigoBarras: textoDeCelda(celda(fila, encabezados, "código de barras", "codigo de barras")) || null,
      categoria: textoDeCelda(celda(fila, encabezados, "categoría", "categoria")) || null,
      precioVenta,
      precioCosto,
      stockMinimo,
      cantidadAIngresar,
    });
  });

  return { filas, errores };
}
