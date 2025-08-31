// src/User/pbUsuario/interfaces/ProductoBancarioUsuario.ts

export type Estado = 0 | 1;

// Catálogos mínimos
export type UsuarioLite = { id: number; nombres: string; apellidos: string };
export type PBLite      = { id: number; titulo: string }; // Producto bancario
export type PBTLite     = { id: number; titulo: string }; // Tipo de producto bancario
export type CategoriaLite = { id: number; titulo: string }; // tipo_cuenta_tarjeta
export type MonedaLite  = { id: number; titulo: string; simbolo: string };

// Asignado (pb tipo asignado)
export type PBAsignado = {
  id: number;
  id_producto_bancario: number;
  id_producto_bancario_tipo: number;
  id_categoria: number;
};

export type ProductoBancarioUsuario = {
  id: number;
  id_usuario_producto: number;
  monto: number;
  disponible: number;
  id_producto_bancario_asignado: number;
  id_moneda_tipo: number;
  estado: Estado;
  fecha?: string | null;
  id_usuario?: number | null;
  fecha_ultimo_corte?: string | null;
};

export type ProductoBancarioUsuarioSave = {
  id_usuario_producto: number;
  monto: number;
  disponible: number;
  id_producto_bancario_asignado: number;
  id_moneda_tipo: number;
  estado: Estado;
  fecha_ultimo_corte?: string | null;
};