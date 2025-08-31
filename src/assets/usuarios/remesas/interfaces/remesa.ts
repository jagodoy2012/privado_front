// src/pages/banca/remesas/interfaces/remesa.ts
export type RemesaRaw = {
  id: number;
  id_producto_bancario_usuario: number; // (cuenta origen o receptor según etapa)
  id_usuario: number | null;            // puede ser null si aún no cobrada
  id_moneda_tipo?: number;
  no_pago: string;
  nombre_receptor?: string | null;
  nombre_remitente?: string | null;
  monto: number;
  estado: number;                       // 1=activo (pendiente)
  /** algunos backends guardan como 'fecha_envio' */
  fecha?: string;                       // opcional si backend usa 'fecha_envio'
  fecha_envio?: string | null;          // YYYY-MM-DD o ISO
  tipo?: string | null;
};

export type Remesa = RemesaRaw;

export type RemesaNuevaEnvio = {
  id_usuario: number;
  id_producto_bancario_usuario: number; // cuenta que envía
  id_moneda_tipo: number;
  nombre_receptor: string;
  nombre_remitente?: string | null;

  monto: number;
  /** se envía como fecha_envio al backend */
  fecha_envio: string;                  // YYYY-MM-DD
  estado: 1 | 0;         
  fecha: string;               // 1
  /** generado en frontend con helper */
  no_pago: string;
};

export type RemesaCobro = {
  no_pago: string;
  id_producto_bancario_usuario: number; // cuenta que recibe (para tus procesos contables)
  fecha: string;                         // YYYY-MM-DD (sólo uso local)
};

export type RemesaLiteByNoPago = {
  id: number;
  id_usuario: number | null; // null si no cobrada
  id_moneda_tipo: number;
  monto: number;
  estado: number;
  nombre_receptor?: string | null;
  nombre_remitente?: string | null;
  fecha_envio?: string | null;
  no_pago: string;
};