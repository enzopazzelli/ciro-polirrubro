import ExcelJS from "exceljs";
import { celdaSegura } from "@/lib/excel/celdaSegura";

export interface FilaExportarVenta {
  numero: number;
  creado_en: string;
  cliente: string | null;
  vendedor: string | null;
  formas_de_pago: string;
  total: number;
  anulada: boolean;
}

export async function generarExcelVentas(filas: FilaExportarVenta[]): Promise<Uint8Array> {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Ventas");

  hoja.columns = [
    { header: "Número", key: "numero", width: 10 },
    { header: "Fecha", key: "fecha", width: 20 },
    { header: "Cliente", key: "cliente", width: 24 },
    { header: "Vendedor", key: "vendedor", width: 18 },
    { header: "Formas de pago", key: "formas_de_pago", width: 30 },
    { header: "Total", key: "total", width: 14 },
    { header: "Anulada", key: "anulada", width: 10 },
  ];
  hoja.getRow(1).font = { bold: true };

  for (const f of filas) {
    hoja.addRow({
      numero: f.numero,
      fecha: new Date(f.creado_en).toLocaleString("es-AR"),
      cliente: celdaSegura(f.cliente ?? "Consumidor final"),
      vendedor: celdaSegura(f.vendedor ?? ""),
      formas_de_pago: f.formas_de_pago,
      total: f.total,
      anulada: f.anulada ? "Sí" : "No",
    });
  }

  const buffer = await libro.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
