export type Rol = "admin" | "operador";
export type TipoMovimientoStock = "venta" | "ingreso" | "ajuste" | "devolucion";
export type TipoMovimientoCuenta = "cargo" | "pago" | "ajuste";
export type FormaPago = "efectivo" | "transferencia" | "tarjeta" | "credito";
export type TipoMovimientoCaja = "ingreso" | "egreso";
export type EstadoCaja = "abierta" | "cerrada";

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string;
          nombre: string;
          rol: Rol;
          activo: boolean;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          id: string;
          nombre: string;
          rol: Rol;
          activo?: boolean;
        };
        Update: {
          nombre?: string;
          rol?: Rol;
          activo?: boolean;
        };
        Relationships: [];
      };
      categorias: {
        Row: {
          id: string;
          nombre: string;
          orden: number;
        };
        Insert: {
          id?: string;
          nombre: string;
          orden?: number;
        };
        Update: {
          nombre?: string;
          orden?: number;
        };
        Relationships: [];
      };
      productos: {
        Row: {
          id: string;
          nombre: string;
          codigo_barras: string | null;
          categoria_id: string | null;
          precio_venta: number;
          precio_costo: number | null;
          stock_actual: number;
          stock_minimo: number;
          activo: boolean;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          codigo_barras?: string | null;
          categoria_id?: string | null;
          precio_venta: number;
          precio_costo?: number | null;
          stock_minimo?: number;
          activo?: boolean;
        };
        Update: {
          nombre?: string;
          codigo_barras?: string | null;
          categoria_id?: string | null;
          precio_venta?: number;
          precio_costo?: number | null;
          stock_minimo?: number;
          activo?: boolean;
        };
        Relationships: [];
      };
      movimientos_stock: {
        Row: {
          id: string;
          producto_id: string;
          cantidad: number;
          tipo: TipoMovimientoStock;
          referencia_id: string | null;
          motivo: string | null;
          usuario_id: string | null;
          creado_en: string;
          creado_en_local: string | null;
        };
        Insert: {
          id?: string;
          producto_id: string;
          cantidad: number;
          tipo: TipoMovimientoStock;
          referencia_id?: string | null;
          motivo?: string | null;
          usuario_id?: string | null;
          creado_en_local?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      clientes: {
        Row: {
          id: string;
          nombre: string;
          telefono: string | null;
          limite_credito: number;
          saldo: number;
          activo: boolean;
          creado_en: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          telefono?: string | null;
          limite_credito?: number;
          activo?: boolean;
        };
        Update: {
          nombre?: string;
          telefono?: string | null;
          limite_credito?: number;
          activo?: boolean;
        };
        Relationships: [];
      };
      movimientos_cuenta: {
        Row: {
          id: string;
          cliente_id: string;
          monto: number;
          tipo: TipoMovimientoCuenta;
          venta_id: string | null;
          usuario_id: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          monto: number;
          tipo: TipoMovimientoCuenta;
          venta_id?: string | null;
          usuario_id?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      cajas: {
        Row: {
          id: string;
          abierta_en: string;
          monto_apertura: number;
          cerrada_en: string | null;
          monto_cierre_declarado: number | null;
          monto_cierre_calculado: number | null;
          diferencia: number | null;
          usuario_apertura_id: string | null;
          usuario_cierre_id: string | null;
          estado: EstadoCaja;
        };
        Insert: {
          id?: string;
          abierta_en: string;
          monto_apertura: number;
          usuario_apertura_id?: string | null;
          estado?: EstadoCaja;
        };
        Update: {
          cerrada_en?: string | null;
          monto_cierre_declarado?: number | null;
          monto_cierre_calculado?: number | null;
          diferencia?: number | null;
          usuario_cierre_id?: string | null;
          estado?: EstadoCaja;
        };
        Relationships: [];
      };
      ventas: {
        Row: {
          id: string;
          numero: number;
          cliente_id: string | null;
          usuario_id: string | null;
          total: number;
          caja_id: string | null;
          anulada: boolean;
          creado_en: string;
          creado_en_local: string | null;
          dispositivo_id: string | null;
        };
        Insert: {
          id?: string;
          cliente_id?: string | null;
          usuario_id?: string | null;
          total: number;
          caja_id?: string | null;
          creado_en_local?: string | null;
          dispositivo_id?: string | null;
        };
        Update: {
          anulada?: boolean;
        };
        Relationships: [];
      };
      venta_items: {
        Row: {
          id: string;
          venta_id: string;
          producto_id: string;
          cantidad: number;
          precio_unitario: number;
          subtotal: number;
        };
        Insert: {
          id?: string;
          venta_id: string;
          producto_id: string;
          cantidad: number;
          precio_unitario: number;
          subtotal: number;
        };
        Update: never;
        Relationships: [];
      };
      venta_pagos: {
        Row: {
          id: string;
          venta_id: string;
          forma_pago: FormaPago;
          monto: number;
          monto_recibido: number | null;
        };
        Insert: {
          id?: string;
          venta_id: string;
          forma_pago: FormaPago;
          monto: number;
          monto_recibido?: number | null;
        };
        Update: never;
        Relationships: [];
      };
      movimientos_caja: {
        Row: {
          id: string;
          caja_id: string;
          tipo: TipoMovimientoCaja;
          concepto: string;
          monto: number;
          venta_id: string | null;
          usuario_id: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          caja_id: string;
          tipo: TipoMovimientoCaja;
          concepto: string;
          monto: number;
          venta_id?: string | null;
          usuario_id?: string | null;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      productos_lista: {
        Row: {
          id: string;
          nombre: string;
          codigo_barras: string | null;
          categoria_id: string | null;
          precio_venta: number;
          precio_costo: number | null;
          stock_actual: number;
          stock_minimo: number;
          activo: boolean;
          creado_en: string;
          actualizado_en: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      confirmar_venta: {
        Args: {
          p_venta_id: string;
          p_cliente_id: string | null;
          p_caja_id: string | null;
          p_total: number;
          p_creado_en_local: string;
          p_dispositivo_id: string | null;
          p_items: unknown;
          p_pagos: unknown;
        };
        Returns: void;
      };
      cerrar_caja: {
        Args: {
          p_caja_id: string;
          p_monto_declarado: number;
        };
        Returns: void;
      };
    };
  };
}
