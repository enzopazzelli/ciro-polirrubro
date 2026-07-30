import Dexie, { type Table } from "dexie";

// Esta es solo la definición del esquema local. El motor que vacía
// la outbox contra Supabase se construye en la Etapa 4
// (sincronización offline) — acá solo se deja la base lista para
// que las pantallas puedan escribir en ella desde el día uno.

export interface RegistroOutbox {
  id?: number;
  operacion: "insert" | "update";
  tabla: string;
  payload: Record<string, unknown>;
  intentos: number;
  ultimo_error?: string;
  estado: "pendiente" | "enviando" | "fallida";
  creado_en: number;
}

export interface CategoriaLocal {
  id: string;
  nombre: string;
  orden: number;
}

export interface ProductoLocal {
  id: string;
  nombre: string;
  codigo_barras: string | null;
  categoria_id: string | null;
  precio_venta: number;
  precio_costo: number | null;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
}

export interface ClienteLocal {
  id: string;
  nombre: string;
  telefono: string | null;
  limite_credito: number;
  saldo: number;
  activo: boolean;
}

export interface VentaLocal {
  id: string;
  numero: number | null;
  cliente_id: string | null;
  usuario_id: string | null;
  total: number;
  caja_id: string | null;
  anulada: boolean;
  creado_en_local: number;
}

export interface VentaItemLocal {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface VentaPagoLocal {
  id: string;
  venta_id: string;
  forma_pago: string;
  monto: number;
  monto_recibido: number | null;
}

class BaseLocal extends Dexie {
  outbox!: Table<RegistroOutbox, number>;
  categorias!: Table<CategoriaLocal, string>;
  productos!: Table<ProductoLocal, string>;
  clientes!: Table<ClienteLocal, string>;
  ventas!: Table<VentaLocal, string>;
  venta_items!: Table<VentaItemLocal, string>;
  venta_pagos!: Table<VentaPagoLocal, string>;

  constructor() {
    super("ciro_polirrubro");

    this.version(1).stores({
      outbox: "++id, estado, creado_en",
      categorias: "id",
      productos: "id, codigo_barras, categoria_id, activo",
      clientes: "id, nombre, activo",
      ventas: "id, creado_en_local, caja_id",
      venta_items: "id, venta_id",
      venta_pagos: "id, venta_id",
    });
  }
}

export const db = new BaseLocal();
