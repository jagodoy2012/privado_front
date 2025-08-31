// ==== RAW (como viene del backend) ====
export type OperacionAsignadoRaw = {
  id: number;
  id_operaciones: number;
  id_producto_bancario: number;
  titulo?: string | null;
};

export type CuentaRaw = {
  id: number; // id_producto_bancario_usuario
  id_usuario_producto: number;
  id_producto_bancario_asignado: number;
  id_moneda_tipo: number;
  monto: number;
  disponible: number;
  fecha_ultimo_corte?: string | null;
  estado: number;
};

export type TransaccionRaw = {
  id: number;
  id_producto_bancario_usuario_envia: number;
  id_producto_bancario_usuario_recibe: number;
  id_operaciones: number;
  id_moneda_tipo: number;
  monto: number;
  cambio: number;
  nota?: string | null;
  fecha_realizado: string; // ISO
  estado: number;
  tipo?: string | null; // si tu API lo manda
};

export type CuentaTercero = {
  id: number;
  id_usuario_prim: number;
  id_producto_bancario_usuario: number;
  alias: string;
  estado: number;
  fecha: string;
};

// ==== Normalizadas para UI ====
export type OperacionAsignado = {
  id: number;
  id_operaciones: number;
  id_producto_bancario: number;
  titulo: string;
};

export type Cuenta = CuentaRaw;
export type Transaccion = TransaccionRaw;

export type MonedaLite = {
  id: number;
  simbolo: string;
  titulo?: string;
};

export type UsuarioLite = { id: number; nombres: string; apellidos: string };

// ==== Payloads ====
export type NuevaTransaccion = {
  id_producto_bancario_usuario_envia: number;
  id_producto_bancario_usuario_recibe: number;
  id_operaciones: number;
  id_moneda_tipo: number;
  monto: number;
  cambio: number;
  nota?: string;
  fecha_realizado: string; // YYYY-MM-DD
  estado: 0 | 1;
  fecha: string;
  id_usuario: 1;
};

export type NuevaCuentaTercero = {
  id_usuario_prim: number;
  id_producto_bancario_usuario: number;
  alias: string;
  estado: 0 | 1;
};