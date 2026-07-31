import ExcelJS from "exceljs";

export interface FilaExportarCliente {
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  notas: string | null;
  limite_credito: number;
  saldo: number;
  activo: boolean;
}

export async function generarExcelClientes(filas: FilaExportarCliente[]): Promise<Uint8Array> {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Clientes");

  hoja.columns = [
    { header: "Nombre", key: "nombre", width: 28 },
    { header: "Teléfono", key: "telefono", width: 16 },
    { header: "Dirección", key: "direccion", width: 28 },
    { header: "Notas", key: "notas", width: 30 },
    { header: "Límite de crédito", key: "limite_credito", width: 18 },
    { header: "Saldo (deuda)", key: "saldo", width: 16 },
    { header: "Activo", key: "activo", width: 10 },
  ];
  hoja.getRow(1).font = { bold: true };

  for (const f of filas) {
    hoja.addRow({
      nombre: f.nombre,
      telefono: f.telefono ?? "",
      direccion: f.direccion ?? "",
      notas: f.notas ?? "",
      limite_credito: f.limite_credito,
      saldo: f.saldo,
      activo: f.activo ? "Sí" : "No",
    });
  }

  const buffer = await libro.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
